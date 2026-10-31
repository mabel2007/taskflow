SET NAMES utf8mb4; -- garante os acentos quando o script roda pelo terminal
DROP DATABASE IF EXISTS taskflow;
CREATE DATABASE taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE taskflow;
CREATE TABLE usuarios (
id INT UNSIGNED NOT NULL AUTO_INCREMENT,
nome VARCHAR(100) NOT NULL,
email VARCHAR(150) NOT NULL,
senha_hash CHAR(60) NOT NULL, -- hash bcrypt, NUNCA a senha
criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT pk_usuarios PRIMARY KEY (id),
CONSTRAINT uq_usuarios_email UNIQUE (email)
);
CREATE TABLE tarefas (
id INT UNSIGNED NOT NULL AUTO_INCREMENT,
usuario_id INT UNSIGNED NOT NULL,
titulo VARCHAR(120) NOT NULL,
descricao TEXT NULL,
prioridade ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
status ENUM('não_iniciado', 'em_andamento', 'concluida') NOT NULL DEFAULT 'não_iniciado',
prazo DATE NULL,
criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
atualizada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
concluida_em DATETIME NULL,
CONSTRAINT pk_tarefas PRIMARY KEY (id),
CONSTRAINT fk_tarefas_usuario FOREIGN KEY (usuario_id)
REFERENCES usuarios (id) ON DELETE CASCADE,
CONSTRAINT ck_tarefas_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) >= 3)
);
CREATE TABLE tags (
id INT UNSIGNED NOT NULL AUTO_INCREMENT,
usuario_id INT UNSIGNED NOT NULL,
nome VARCHAR(40) NOT NULL,
CONSTRAINT pk_tags PRIMARY KEY (id),
CONSTRAINT uq_tags_usuario_nome UNIQUE (usuario_id, nome),
CONSTRAINT fk_tags_usuario FOREIGN KEY (usuario_id)
REFERENCES usuarios (id) ON DELETE CASCADE
);
CREATE TABLE tarefa_tag (
tarefa_id INT UNSIGNED NOT NULL,
tag_id INT UNSIGNED NOT NULL,
CONSTRAINT pk_tarefa_tag PRIMARY KEY (tarefa_id, tag_id),
CONSTRAINT fk_tarefa_tag_tarefa FOREIGN KEY (tarefa_id)
REFERENCES tarefas (id) ON DELETE CASCADE,
CONSTRAINT fk_tarefa_tag_tag FOREIGN KEY (tag_id)
REFERENCES tags (id) ON DELETE CASCADE
);
-- ... depois vêm os INSERT com os dois usuários (Ana e Bruno, senha: senha123)
-- e as mesmas seis tarefas do dados.ts da Aula 1