
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from "./database.js";

const app = express();
const PORTA = 3000;

// Configurações básicas
app.disable("x-powered-by");

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(express.json({ limit: "20kb" }));

// Sessão temporária para o ambiente de desenvolvimento
app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "chave-temporaria-taskflow-desenvolvimento",

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

// Limita tentativas de login e cadastro
const limiteAutenticacao = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        erro: "Muitas tentativas. Aguarde alguns minutos."
    }
});

// Validação de e-mail
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Retorna somente os dados públicos do usuário
function usuarioPublico(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    };
}

// Protege rotas que exigem autenticação
function exigirLogin(req, res, next) {
    if (!req.session.usuarioId) {
        return res.status(401).json({
            erro: "Você precisa entrar na sua conta."
        });
    }

    next();
}

// ======================================
// CADASTRO
// ======================================

app.post(
    "/api/auth/cadastro",
    limiteAutenticacao,
    async (req, res) => {
        try {
            const { nome, email, senha } = req.body ?? {};

            if (
                typeof nome !== "string" ||
                nome.trim().length < 2
            ) {
                return res.status(400).json({
                    erro: "Informe um nome com pelo menos 2 caracteres."
                });
            }

            if (
                typeof email !== "string" ||
                !validarEmail(email.trim())
            ) {
                return res.status(400).json({
                    erro: "Informe um e-mail válido."
                });
            }

            if (
                typeof senha !== "string" ||
                senha.length < 8 ||
                senha.length > 72
            ) {
                return res.status(400).json({
                    erro: "A senha deve ter entre 8 e 72 caracteres."
                });
            }

            const emailNormalizado = email.trim().toLowerCase();

            const existente = db.prepare(
                "SELECT id FROM usuarios WHERE email = ?"
            ).get(emailNormalizado);

            if (existente) {
                return res.status(409).json({
                    erro: "Este e-mail já possui cadastro."
                });
            }

            const senhaHash = await bcrypt.hash(senha, 12);

            const resultado = db.prepare(`
                INSERT INTO usuarios (nome, email, senha_hash)
                VALUES (?, ?, ?)
            `).run(
                nome.trim(),
                emailNormalizado,
                senhaHash
            );

            const usuario = db.prepare(`
                SELECT id, nome, email
                FROM usuarios
                WHERE id = ?
            `).get(Number(resultado.lastInsertRowid));

            req.session.regenerate((erro) => {
                if (erro) {
                    return res.status(500).json({
                        erro: "Não foi possível iniciar sua sessão."
                    });
                }

                req.session.usuarioId = usuario.id;

                req.session.save((erroSalvar) => {
                    if (erroSalvar) {
                        return res.status(500).json({
                            erro: "Não foi possível salvar sua sessão."
                        });
                    }

                    return res.status(201).json({
                        mensagem: "Cadastro realizado com sucesso.",
                        usuario: usuarioPublico(usuario)
                    });
                });
            });

        } catch (erro) {
            console.error("Erro no cadastro:", erro);

            return res.status(500).json({
                erro: "Não foi possível realizar o cadastro."
            });
        }
    }
);

// ======================================
// LOGIN
// ======================================

app.post(
    "/api/auth/login",
    limiteAutenticacao,
    async (req, res) => {
        try {
            const { email, senha } = req.body ?? {};

            if (
                typeof email !== "string" ||
                typeof senha !== "string"
            ) {
                return res.status(400).json({
                    erro: "Informe e-mail e senha."
                });
            }

            const usuario = db.prepare(`
                SELECT id, nome, email, senha_hash
                FROM usuarios
                WHERE email = ?
            `).get(email.trim().toLowerCase());

            if (
                !usuario ||
                !(await bcrypt.compare(senha, usuario.senha_hash))
            ) {
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos."
                });
            }

            req.session.regenerate((erro) => {
                if (erro) {
                    return res.status(500).json({
                        erro: "Não foi possível iniciar sua sessão."
                    });
                }

                req.session.usuarioId = usuario.id;

                req.session.save((erroSalvar) => {
                    if (erroSalvar) {
                        return res.status(500).json({
                            erro: "Não foi possível salvar sua sessão."
                        });
                    }

                    return res.json({
                        mensagem: "Login realizado com sucesso.",
                        usuario: usuarioPublico(usuario)
                    });
                });
            });

        } catch (erro) {
            console.error("Erro no login:", erro);

            return res.status(500).json({
                erro: "Não foi possível realizar o login."
            });
        }
    }
);

// ======================================
// CONSULTAR USUÁRIO LOGADO
// ======================================

app.get("/api/auth/me", exigirLogin, (req, res) => {
    const usuario = db.prepare(`
        SELECT id, nome, email
        FROM usuarios
        WHERE id = ?
    `).get(req.session.usuarioId);

    if (!usuario) {
        return res.status(401).json({
            erro: "Usuário não encontrado."
        });
    }

    return res.json({
        usuario: usuarioPublico(usuario)
    });
});

// ======================================
// LOGOUT
// ======================================

app.post("/api/auth/logout", exigirLogin, (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            return res.status(500).json({
                erro: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("connect.sid");

        return res.json({
            mensagem: "Sessão encerrada."
        });
    });
});

// Inicialização do servidor
app.listen(PORTA, () => {
    console.log(`TaskFlow backend disponível em http://localhost:${PORTA}`);
});
