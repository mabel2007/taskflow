# TaskFlow — código de referência do professor

Gerenciador de tarefas com TypeScript (Vite), API em Node.js (Express + mysql2) e MySQL 8.
Versão final do curso (Aula 6), com os desafios prata e ouro (editar, prazo, tags).

## Como rodar

1. Crie o banco: rode `banco/taskflow.sql` no MySQL Workbench.
   (MariaDB/XAMPP: troque `utf8mb4_0900_ai_ci` por `utf8mb4_unicode_ci`.)
2. Na pasta `api`: copie `.env.exemplo` para `.env` e preencha a senha do MySQL e um `JWT_SEGREDO`.
3. Na pasta `api`: `npm install` e depois `npm run dev` (porta 3000).
4. Em outro terminal, na pasta `taskflow`: `npm install` e depois `npm run dev` (porta 5173).
5. Abra http://localhost:5173 e entre com ana@taskflow.dev / senha123
   (ou bruno@taskflow.dev / senha123).

## Estrutura

- `index.html`, `css/`, `src/` — a página (TypeScript + Vite)
- `api/src/` — a API (Express + mysql2 + bcryptjs + jsonwebtoken)
- `banco/taskflow.sql` — criação das tabelas e dados de exemplo

## O código de cada aula

A pasta `etapas/` (ao lado desta) tem o código exatamente como ele aparece em cada fascículo:
`aula1` (15/10) até `aula6` (19/11), e `final`, que é igual a esta pasta. A `aula1` traz também
o `index.html` daquela aula. Todas as etapas passam no `tsc --noEmit`, e as APIs das Aulas 3 a 6
foram executadas contra um banco real.

## Gabaritos

A pasta `gabaritos/` tem as respostas dos exercícios e das entregas que aparecem no material
do professor, com o número da aula no nome do arquivo. Os arquivos `.ts` passam no `tsc` e os
`.sql` foram executados no banco do TaskFlow. Rode o `banco/taskflow.sql` de novo depois de
testar os `.sql`: alguns alteram os dados de exemplo.

## Extras do código de referência

O código final tem dois recursos que não aparecem nos fascículos e podem ser mostrados como
desafio: o tema claro/escuro e o campo de prazo com destaque para tarefas atrasadas.
