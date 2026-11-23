-- =============================================================
-- TaskFlow — banco de dados MySQL 8
-- Grupo Anchieta · Aula 2 (22/10)
-- Rode este script inteiro no MySQL Workbench (raio ⚡) ou com:
--   mysql -u root -p < banco/taskflow.sql
-- Ele APAGA e recria o banco: use só em ambiente de aula.
-- =============================================================

SET NAMES utf8mb4;   -- garante os acentos quando o script roda pelo terminal

DROP DATABASE IF EXISTS taskflow;

CREATE DATABASE taskflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskflow;

-- -------------------------------------------------------------
-- usuarios: quem usa o sistema
-- -------------------------------------------------------------
CREATE TABLE usuarios (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  senha_hash  CHAR(60)      NOT NULL,          -- hash bcrypt, NUNCA a senha
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios        PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email  UNIQUE (email)
);

-- -------------------------------------------------------------
-- tarefas: o coração do sistema (espelho da interface Tarefa)
-- os ENUM são os mesmos valores dos union types Prioridade e Status
-- -------------------------------------------------------------
CREATE TABLE tarefas (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED  NOT NULL,
  titulo        VARCHAR(120)  NOT NULL,
  descricao     TEXT          NULL,
  prioridade    ENUM('baixa', 'media', 'alta')                   NOT NULL DEFAULT 'media',
  status        ENUM('pendente', 'em_andamento', 'concluida')    NOT NULL DEFAULT 'pendente',
  prazo         DATE          NULL,
  criada_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  concluida_em  DATETIME      NULL,
  CONSTRAINT pk_tarefas PRIMARY KEY (id),
  CONSTRAINT fk_tarefas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT ck_tarefas_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) >= 3)
);

-- a consulta mais comum: "as tarefas DESTE usuário com ESTE status"
CREATE INDEX ix_tarefas_usuario_status ON tarefas (usuario_id, status);

-- -------------------------------------------------------------
-- tags: cada usuário tem as suas etiquetas
-- -------------------------------------------------------------
CREATE TABLE tags (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  nome        VARCHAR(40)  NOT NULL,
  CONSTRAINT pk_tags PRIMARY KEY (id),
  CONSTRAINT uq_tags_usuario_nome UNIQUE (usuario_id, nome),
  CONSTRAINT fk_tags_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- tarefa_tag: relacionamento N:N entre tarefas e tags
-- (no TypeScript era só tags: string[])
-- -------------------------------------------------------------
CREATE TABLE tarefa_tag (
  tarefa_id  INT UNSIGNED NOT NULL,
  tag_id     INT UNSIGNED NOT NULL,
  CONSTRAINT pk_tarefa_tag PRIMARY KEY (tarefa_id, tag_id),
  CONSTRAINT fk_tarefa_tag_tarefa FOREIGN KEY (tarefa_id)
    REFERENCES tarefas (id) ON DELETE CASCADE,
  CONSTRAINT fk_tarefa_tag_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE
);

-- =============================================================
-- DADOS DE EXEMPLO — as mesmas seis tarefas do dados.ts da Aula 1
-- Senha dos dois usuários: senha123
-- =============================================================
INSERT INTO usuarios (nome, email, senha_hash) VALUES
  ('Ana Souza',    'ana@taskflow.dev',   '$2b$10$X46TZdkKX8P2NZNov1SoaOmtQ5JmGB.x/nK1IWAMCrYuZ1/TBFGcS'),
  ('Bruno Lima',   'bruno@taskflow.dev', '$2b$10$X46TZdkKX8P2NZNov1SoaOmtQ5JmGB.x/nK1IWAMCrYuZ1/TBFGcS');

INSERT INTO tarefas (usuario_id, titulo, descricao, prioridade, status, prazo, concluida_em) VALUES
  (1, 'Estudar interfaces',   NULL,     'alta',  'pendente',     '2026-10-22', NULL),
  (1, 'Comprar café',         NULL,     'baixa', 'concluida',    NULL,         NOW()),
  (1, 'Revisar pull request', 'PR #42', 'alta',  'em_andamento', '2026-10-16', NULL),
  (1, 'Praticar laços',       NULL,     'media', 'pendente',     NULL,         NULL),
  (1, 'Agendar dentista',     NULL,     'media', 'pendente',     '2026-11-05', NULL),
  (1, 'Organizar a mesa',     NULL,     'baixa', 'pendente',     NULL,         NULL),
  (2, 'Montar o DER',         'Usar o MySQL Workbench', 'alta', 'pendente', '2026-10-15', NULL);

INSERT INTO tags (usuario_id, nome) VALUES
  (1, 'estudo'), (1, 'ts'), (1, 'casa'), (1, 'trabalho'), (1, 'saude'),
  (2, 'banco');

INSERT INTO tarefa_tag (tarefa_id, tag_id) VALUES
  (1, 1), (1, 2),     -- Estudar interfaces: estudo, ts
  (2, 3),             -- Comprar café: casa
  (3, 4),             -- Revisar pull request: trabalho
  (4, 1), (4, 2),     -- Praticar laços: estudo, ts
  (5, 5),             -- Agendar dentista: saude
  (6, 3),             -- Organizar a mesa: casa
  (7, 6);             -- Montar o DER: banco

-- =============================================================
-- CONSULTAS DE CONFERÊNCIA (rode uma de cada vez)
-- =============================================================

-- 1) As tarefas da Ana, com as tags juntas numa coluna
-- SELECT t.id, t.titulo, t.prioridade, t.status,
--        GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ', ') AS tags
--   FROM tarefas t
--   LEFT JOIN tarefa_tag tt ON tt.tarefa_id = t.id
--   LEFT JOIN tags g        ON g.id = tt.tag_id
--  WHERE t.usuario_id = 1
--  GROUP BY t.id
--  ORDER BY FIELD(t.prioridade, 'alta', 'media', 'baixa'), t.titulo;

-- 2) O painel: quantas tarefas em cada status (o reduce da Aula 6)
-- SELECT status, COUNT(*) AS quantidade
--   FROM tarefas
--  WHERE usuario_id = 1
--  GROUP BY status;

-- 3) Esperado: a Ana tem 6 tarefas (4 pendentes, 1 em andamento, 1 concluída)
