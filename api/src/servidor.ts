
import "dotenv/config";
import bcrypt from "bcryptjs";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { exigirLogin, SEGREDO, usuarioDe } from "./autenticacao";
import { banco } from "./banco";
import {
  PRIORIDADES,
  STATUS,
  type DadosTarefa,
  type Status,
} from "./tipos";

const app = express();

// =============================================================
// Cabeçalhos HTTP de segurança
// =============================================================

app.use(
  helmet({
    // A CSP da página será configurada separadamente.
    contentSecurityPolicy: false,
  })
);

// Limita o tamanho do corpo das requisições JSON.
app.use(express.json({ limit: "20kb" }));

// =============================================================
// Proteção contra força bruta no login
// =============================================================

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.",
  },
});

// =============================================================
// Funções auxiliares de validação
// =============================================================

function ehObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function temCampo(
  objeto: object,
  campo: string
): boolean {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function ehPrioridade(
  valor: unknown
): valor is (typeof PRIORIDADES)[number] {
  return (
    typeof valor === "string" &&
    PRIORIDADES.includes(valor as (typeof PRIORIDADES)[number])
  );
}

function ehStatus(valor: unknown): valor is Status {
  return (
    typeof valor === "string" &&
    STATUS.includes(valor as Status)
  );
}

// CORREÇÃO: aceita string ou string[] conforme os tipos do Express.
function validarId(
  valor: string | string[]
): number | undefined {
  if (typeof valor !== "string") {
    return undefined;
  }

  if (!/^[1-9]\d*$/.test(valor)) {
    return undefined;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) ? id : undefined;
}

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  const bissexto =
    ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);

  const diasPorMes = [
    31,
    bissexto ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return (
    ano >= 1000 &&
    mes >= 1 &&
    mes <= 12 &&
    dia >= 1 &&
    dia <= diasPorMes[mes - 1]
  );
}

// =============================================================
// Validação dos dados das tarefas
// =============================================================

function validarDadosTarefa(
  valor: unknown,
  exigeTitulo: boolean
): { dados?: DadosTarefa; erro?: string } {
  if (!ehObjeto(valor)) {
    return { erro: "Os dados enviados são inválidos." };
  }

  const camposPermitidos = [
    "titulo",
    "descricao",
    "prioridade",
    "prazo",
    "tags",
  ];

  if (
    Object.keys(valor).some(
      (campo) => !camposPermitidos.includes(campo)
    )
  ) {
    return {
      erro: "A requisição contém campos não permitidos.",
    };
  }

  const dados: DadosTarefa = {};

  if (exigeTitulo && !temCampo(valor, "titulo")) {
    return { erro: "O título é obrigatório." };
  }

  if (temCampo(valor, "titulo")) {
    const titulo = valor.titulo;

    if (
      typeof titulo !== "string" ||
      titulo.trim().length < 3
    ) {
      return {
        erro: "O título precisa ter pelo menos 3 caracteres.",
      };
    }

    if (titulo.trim().length > 120) {
      return {
        erro: "O título pode ter no máximo 120 caracteres.",
      };
    }

    dados.titulo = titulo.trim();
  }

  if (temCampo(valor, "descricao")) {
    const descricao = valor.descricao;

    if (
      descricao !== null &&
      typeof descricao !== "string"
    ) {
      return {
        erro: "A descrição precisa ser um texto.",
      };
    }

    if (
      typeof descricao === "string" &&
      descricao.length > 5000
    ) {
      return {
        erro: "A descrição pode ter no máximo 5000 caracteres.",
      };
    }

    dados.descricao = descricao as string | null;
  }

  if (temCampo(valor, "prioridade")) {
    if (!ehPrioridade(valor.prioridade)) {
      return { erro: "Prioridade inválida." };
    }

    dados.prioridade = valor.prioridade;
  }

  if (temCampo(valor, "prazo")) {
    const prazo = valor.prazo;

    if (prazo !== null && typeof prazo !== "string") {
      return {
        erro: "O prazo precisa ser uma data válida.",
      };
    }

    if (
      typeof prazo === "string" &&
      prazo !== "" &&
      !dataValida(prazo)
    ) {
      return {
        erro: "O prazo precisa ser uma data real no formato AAAA-MM-DD.",
      };
    }

    dados.prazo = prazo as string | null;
  }

  if (temCampo(valor, "tags")) {
    const tags = valor.tags;

    if (!Array.isArray(tags)) {
      return {
        erro: "As tags precisam ser uma lista de textos.",
      };
    }

    if (tags.length > 20) {
      return {
        erro: "Uma tarefa pode ter no máximo 20 tags.",
      };
    }

    if (
      !tags.every(
        (tag: unknown) =>
          typeof tag === "string" &&
          tag.trim().length > 0 &&
          tag.trim().length <= 40 &&
          !tag.includes(",")
      )
    ) {
      return {
        erro: "As tags devem ser textos de até 40 caracteres, sem vírgulas.",
      };
    }

    dados.tags = tags.map((tag: string) => tag.trim());
  }

  return { dados };
}

// =============================================================
// Tarefas
// =============================================================

const SELECT_TAREFAS = `
  SELECT t.id, t.titulo, t.descricao, t.prioridade, t.status,
         DATE_FORMAT(t.prazo, '%Y-%m-%d') AS prazo,
         t.criada_em AS criadaEm,
         (SELECT GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ',')
            FROM tarefa_tag tt
            JOIN tags g ON g.id = tt.tag_id
           WHERE tt.tarefa_id = t.id
             AND g.usuario_id = t.usuario_id) AS tags
    FROM tarefas t`;

function paraTarefa(linha: RowDataPacket): RowDataPacket {
  return {
    ...linha,
    tags: linha.tags ? String(linha.tags).split(",") : [],
  };
}

// Busca uma tarefa usando a conexão da transação.
async function buscarUmaNaConexao(
  conexao: PoolConnection,
  id: number,
  usuarioId: number
): Promise<RowDataPacket | undefined> {
  const [linhas] = await conexao.execute<RowDataPacket[]>(
    `${SELECT_TAREFAS} WHERE t.id = ? AND t.usuario_id = ?`,
    [id, usuarioId]
  );

  return linhas.length > 0 ? paraTarefa(linhas[0]) : undefined;
}

// Busca uma tarefa usando o pool normal.
async function buscarUma(
  id: number,
  usuarioId: number
): Promise<RowDataPacket | undefined> {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `${SELECT_TAREFAS} WHERE t.id = ? AND t.usuario_id = ?`,
    [id, usuarioId]
  );

  return linhas.length > 0 ? paraTarefa(linhas[0]) : undefined;
}

// =============================================================
// Tags: participam da mesma transação da tarefa
// =============================================================

async function gravarTags(
  conexao: PoolConnection,
  usuarioId: number,
  tarefaId: number,
  tags: string[]
): Promise<void> {
  const nomes = [
    ...new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag !== "")
    ),
  ];

  await conexao.execute(
    "DELETE FROM tarefa_tag WHERE tarefa_id = ?",
    [tarefaId]
  );

  for (const nome of nomes) {
    await conexao.execute(
      "INSERT IGNORE INTO tags (usuario_id, nome) VALUES (?, ?)",
      [usuarioId, nome]
    );

    await conexao.execute(
      `INSERT INTO tarefa_tag (tarefa_id, tag_id)
       SELECT ?, id
         FROM tags
        WHERE usuario_id = ? AND nome = ?`,
      [tarefaId, usuarioId, nome]
    );
  }
}

// =============================================================
// Listar tarefas
// =============================================================

app.get("/api/tarefas", exigirLogin, async (req, res) => {
  let sql = `${SELECT_TAREFAS} WHERE t.usuario_id = ?`;
  const valores: (string | number)[] = [usuarioDe(res)];

  const { status, busca } = req.query;

  if (typeof status === "string" && status !== "") {
    if (!ehStatus(status)) {
      res.status(400).json({ erro: "Status inválido." });
      return;
    }

    sql += " AND t.status = ?";
    valores.push(status);
  }

  if (typeof busca === "string" && busca.trim() !== "") {
    if (busca.length > 120) {
      res.status(400).json({
        erro: "A busca pode ter no máximo 120 caracteres.",
      });
      return;
    }

    sql += " AND t.titulo LIKE ?";
    valores.push(`%${busca.trim()}%`);
  }

  sql += " ORDER BY FIELD(t.prioridade, 'alta', 'media', 'baixa'), t.titulo";

  const [linhas] = await banco.execute<RowDataPacket[]>(sql, valores);

  res.json(linhas.map(paraTarefa));
});

// =============================================================
// Buscar uma tarefa
// =============================================================

app.get("/api/tarefas/:id", exigirLogin, async (req, res) => {
  const id = validarId(req.params.id);

  if (id === undefined) {
    res.status(400).json({ erro: "ID de tarefa inválido." });
    return;
  }

  const tarefa = await buscarUma(id, usuarioDe(res));

  if (!tarefa) {
    res.status(404).json({
      erro: `Tarefa #${id} não encontrada.`,
    });
    return;
  }

  res.json(tarefa);
});

// =============================================================
// Cadastrar tarefa com transação
// =============================================================

app.post("/api/tarefas", exigirLogin, async (req, res) => {
  const resultadoValidacao = validarDadosTarefa(req.body, true);

  if (resultadoValidacao.erro || !resultadoValidacao.dados) {
    res.status(400).json({
      erro: resultadoValidacao.erro ?? "Dados inválidos.",
    });
    return;
  }

  const dados = resultadoValidacao.dados;

  const usuarioId = usuarioDe(res);
  const conexao = await banco.getConnection();

  try {
    await conexao.beginTransaction();

    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO tarefas (usuario_id, titulo, descricao, prioridade, prazo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        usuarioId,
        dados.titulo!,
        dados.descricao ?? null,
        dados.prioridade ?? "media",
        dados.prazo || null,
      ]
    );

    if (dados.tags) {
      await gravarTags(
        conexao,
        usuarioId,
        resultado.insertId,
        dados.tags
      );
    }

    const tarefa = await buscarUmaNaConexao(
      conexao,
      resultado.insertId,
      usuarioId
    );

    await conexao.commit();

    res.status(201).json(tarefa);
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
});

// =============================================================
// Editar tarefa com transação
// =============================================================

app.put("/api/tarefas/:id", exigirLogin, async (req, res) => {
  const id = validarId(req.params.id);

  if (id === undefined) {
    res.status(400).json({ erro: "ID de tarefa inválido." });
    return;
  }

  const resultadoValidacao = validarDadosTarefa(req.body, false);

  if (resultadoValidacao.erro || !resultadoValidacao.dados) {
    res.status(400).json({
      erro: resultadoValidacao.erro ?? "Dados inválidos.",
    });
    return;
  }

  const dados = resultadoValidacao.dados;

  const usuarioId = usuarioDe(res);
  const conexao = await banco.getConnection();

  try {
    await conexao.beginTransaction();

    // Confirma a propriedade da tarefa e bloqueia sua linha durante a operação.
    const [existentes] = await conexao.execute<RowDataPacket[]>(
      `SELECT id
         FROM tarefas
        WHERE id = ? AND usuario_id = ?
        FOR UPDATE`,
      [id, usuarioId]
    );

    if (existentes.length === 0) {
      await conexao.rollback();

      res.status(404).json({
        erro: `Tarefa #${id} não encontrada.`,
      });
      return;
    }

    // Campo ausente mantém o valor existente.
    // null pode limpar campos opcionais.
    const campos = {
      titulo: temCampo(dados, "titulo"),
      descricao: temCampo(dados, "descricao"),
      prioridade: temCampo(dados, "prioridade"),
      prazo: temCampo(dados, "prazo"),
    };

    await conexao.execute<ResultSetHeader>(
      `UPDATE tarefas
          SET titulo     = IF(?, ?, titulo),
              descricao  = IF(?, ?, descricao),
              prioridade = IF(?, ?, prioridade),
              prazo      = IF(?, ?, prazo)
        WHERE id = ? AND usuario_id = ?`,
      [
        campos.titulo,
        dados.titulo ?? null,
        campos.descricao,
        dados.descricao ?? null,
        campos.prioridade,
        dados.prioridade ?? null,
        campos.prazo,
        dados.prazo || null,
        id,
        usuarioId,
      ]
    );

    if (dados.tags !== undefined) {
      await gravarTags(conexao, usuarioId, id, dados.tags);
    }

    const tarefa = await buscarUmaNaConexao(
      conexao,
      id,
      usuarioId
    );

    await conexao.commit();

    res.json(tarefa);
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
});

// =============================================================
// Mudar status
// =============================================================

app.patch("/api/tarefas/:id/status", exigirLogin, async (req, res) => {
  const id = validarId(req.params.id);

  if (id === undefined) {
    res.status(400).json({ erro: "ID de tarefa inválido." });
    return;
  }

  if (!ehObjeto(req.body)) {
    res.status(400).json({
      erro: "Corpo da requisição inválido.",
    });
    return;
  }

  if (
    Object.keys(req.body).some((campo) => campo !== "status")
  ) {
    res.status(400).json({
      erro: "A requisição contém campos não permitidos.",
    });
    return;
  }

  const status = req.body.status;

  if (!ehStatus(status)) {
    res.status(400).json({ erro: "Status inválido." });
    return;
  }

  const [resultado] = await banco.execute<ResultSetHeader>(
    `UPDATE tarefas
        SET status = ?, concluida_em = IF(? = 'concluida', NOW(), NULL)
      WHERE id = ? AND usuario_id = ?`,
    [status, status, id, usuarioDe(res)]
  );

  if (resultado.affectedRows === 0) {
    res.status(404).json({
      erro: `Tarefa #${id} não encontrada.`,
    });
    return;
  }

  res.status(204).end();
});

// =============================================================
// Remover tarefa
// =============================================================

app.delete("/api/tarefas/:id", exigirLogin, async (req, res) => {
  const id = validarId(req.params.id);

  if (id === undefined) {
    res.status(400).json({ erro: "ID de tarefa inválido." });
    return;
  }

  const [resultado] = await banco.execute<ResultSetHeader>(
    "DELETE FROM tarefas WHERE id = ? AND usuario_id = ?",
    [id, usuarioDe(res)]
  );

  if (resultado.affectedRows === 0) {
    res.status(404).json({
      erro: `Tarefa #${id} não encontrada.`,
    });
    return;
  }

  res.status(204).end();
});

// =============================================================
// Estatísticas
// =============================================================

app.get("/api/estatisticas", exigirLogin, async (_req, res) => {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS quantidade
       FROM tarefas
      WHERE usuario_id = ?
      GROUP BY status`,
    [usuarioDe(res)]
  );

  const contagem: Record<Status, number> = {
    pendente: 0,
    em_andamento: 0,
    concluida: 0,
  };

  for (const linha of linhas) {
    if (ehStatus(linha.status)) {
      contagem[linha.status] = Number(linha.quantidade);
    }
  }

  res.json(contagem);
});

// =============================================================
// Usuários
// =============================================================

app.post("/api/usuarios", async (req, res) => {
  if (!ehObjeto(req.body)) {
    res.status(400).json({
      erro: "Os dados de cadastro são inválidos.",
    });
    return;
  }

  if (
    Object.keys(req.body).some(
      (campo) => !["nome", "email", "senha"].includes(campo)
    )
  ) {
    res.status(400).json({
      erro: "A requisição contém campos não permitidos.",
    });
    return;
  }

  const { nome, email, senha } = req.body;

  if (
    typeof nome !== "string" ||
    nome.trim().length < 2 ||
    nome.trim().length > 80 ||
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof senha !== "string" ||
    senha.length < 6 ||
    senha.length > 128
  ) {
    res.status(400).json({
      erro: "Preencha nome, e-mail válido e senha entre 6 e 128 caracteres.",
    });
    return;
  }

  const hash = await bcrypt.hash(senha, 10);

  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nome.trim(), email.trim().toLowerCase(), hash]
    );

    res.status(201).json({ id: resultado.insertId });
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({
        erro: "Este e-mail já está cadastrado.",
      });
      return;
    }

    throw erro;
  }
});

// =============================================================
// Login protegido contra excesso de tentativas
// =============================================================

app.post("/api/login", limiteLogin, async (req, res) => {
  if (!ehObjeto(req.body)) {
    res.status(400).json({
      erro: "Dados de login inválidos.",
    });
    return;
  }

  const { email, senha } = req.body;

  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    email.length > 254 ||
    typeof senha !== "string" ||
    senha.length === 0 ||
    senha.length > 128
  ) {
    res.status(400).json({
      erro: "Informe um e-mail e uma senha válidos.",
    });
    return;
  }

  const [linhas] = await banco.execute<RowDataPacket[]>(
    "SELECT id, nome, senha_hash FROM usuarios WHERE email = ?",
    [email.trim().toLowerCase()]
  );

  const usuario = linhas[0];

  if (
    !usuario ||
    !(await bcrypt.compare(senha, usuario.senha_hash))
  ) {
    res.status(401).json({
      erro: "E-mail ou senha inválidos.",
    });
    return;
  }

  const token = jwt.sign(
    { id: usuario.id },
    SEGREDO,
    { expiresIn: "8h" }
  );

  res.json({ token, nome: usuario.nome });
});

// =============================================================
// Dados do usuário logado
// =============================================================

app.get("/api/eu", exigirLogin, async (_req, res) => {
  const [linhas] = await banco.execute<RowDataPacket[]>(
    `SELECT id, nome, email, criado_em AS criadoEm
       FROM usuarios
      WHERE id = ?`,
    [usuarioDe(res)]
  );

  res.json(linhas[0]);
});

// =============================================================
// Erros não previstos
// =============================================================

app.use((
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(erro);

  const erroJson = erro as {
    status?: number;
    type?: string;
  };

  if (
    erro instanceof SyntaxError &&
    erroJson.status === 400 &&
    erroJson.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      erro: "O JSON enviado é inválido.",
    });
    return;
  }

  res.status(500).json({
    erro: "Algo deu errado no servidor. Tente de novo.",
  });
});

// =============================================================
// Inicialização
// =============================================================

const PORTA = Number(process.env.PORTA ?? 3000);

app.listen(PORTA, () => {
  console.log(`API do TaskFlow em http://localhost:${PORTA}`);
});
