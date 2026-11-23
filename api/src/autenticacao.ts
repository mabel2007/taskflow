
import "dotenv/config";

import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { banco } from "./banco";

// Não permite iniciar a API com um segredo padrão ou ausente.
const segredo = process.env.JWT_SEGREDO;

if (!segredo || segredo.length < 32) {
  throw new Error(
    "JWT_SEGREDO não configurado ou muito curto. Configure um segredo seguro no .env."
  );
}

export const SEGREDO = segredo;

// Middleware: valida o token e identifica o usuário autenticado.
export function exigirLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const cabecalho = req.headers.authorization;

  const token = cabecalho?.startsWith("Bearer ")
    ? cabecalho.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ erro: "Faça login para continuar." });
    return;
  }

  let usuarioId: number;

  try {
    const dados = jwt.verify(token, SEGREDO, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (
      typeof dados === "string" ||
      !Number.isSafeInteger(dados.id) ||
      dados.id <= 0
    ) {
      res.status(401).json({ erro: "Token inválido." });
      return;
    }

    usuarioId = dados.id;
  } catch {
    res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
    return;
  }

  // Confere se a conta ainda existe no banco.
  void banco
    .execute<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE id = ? LIMIT 1",
      [usuarioId]
    )
    .then(([usuarios]) => {
      if (usuarios.length === 0) {
        res.status(401).json({
          erro: "Esta conta não existe mais. Entre novamente.",
        });
        return;
      }

      // A identidade vem do token validado, nunca do corpo da requisição.
      res.locals.usuarioId = usuarioId;
      next();
    })
    .catch(next);
}

// Identifica o usuário autenticado nesta requisição.
export function usuarioDe(res: Response): number {
  return res.locals.usuarioId as number;
}
