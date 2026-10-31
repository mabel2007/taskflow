
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utiliza a pasta banco que já existe no projeto
const pastaBanco = path.resolve(__dirname, "../banco");

if (!fs.existsSync(pastaBanco)) {
    fs.mkdirSync(pastaBanco, { recursive: true });
}

// Cria o arquivo automaticamente, caso não exista
const db = new Database(
    path.join(pastaBanco, "taskflow_teste.db")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chamados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        assunto TEXT NOT NULL,
        descricao TEXT,
        urgencia TEXT NOT NULL DEFAULT 'media'
            CHECK (urgencia IN ('baixa', 'media', 'alta')),
        status TEXT NOT NULL DEFAULT 'aberto'
            CHECK (status IN ('aberto', 'em_atendimento', 'resolvido')),
        aberto_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolvido_em TEXT,
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE,
        CHECK (length(trim(assunto)) >= 3)
    );

    CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        UNIQUE (usuario_id, nome),
        FOREIGN KEY (usuario_id)
            REFERENCES usuarios(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chamado_tag (
        chamado_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (chamado_id, tag_id),
        FOREIGN KEY (chamado_id)
            REFERENCES chamados(id)
            ON DELETE CASCADE,
        FOREIGN KEY (tag_id)
            REFERENCES tags(id)
            ON DELETE CASCADE
    );
`);

export default db;
