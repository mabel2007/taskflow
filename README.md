# TaskFlow — Reconstrução e implementação de melhorias

Esta versão do TaskFlow representa uma nova implementação do sistema, desenvolvida a partir do modelo de referência disponibilizado pelo professor e de suas funcionalidades. A aplicação foi reconstruída em uma nova estrutura de projeto, com adaptações no frontend, backend, banco de dados e mecanismos de segurança.

### Principais alterações

**1. Reconstrução da aplicação**
- Reorganização da estrutura do projeto.
- Adaptação do modelo do professor às funcionalidades do TaskFlow.
- Integração entre frontend e backend utilizando TypeScript.
- Organização dos arquivos e módulos da aplicação.

**2. Migração do banco de dados**
- Substituição do SQLite pelo MySQL.
- Implementação da conexão com o banco utilizando mysql2.
- Organização da estrutura SQL e das configurações de conexão.
- Separação das variáveis de ambiente em arquivo `.env`, não versionado.

**3. Funcionalidades**
- Cadastro e autenticação de usuários.
- Criação, consulta e edição de tarefas.
- Gerenciamento de status e prioridades.
- Organização por prazos e tags.
- Filtros e visualização de estatísticas.
- Separação das tarefas por usuário.

**4. Implementação de segurança**
- Proteção contra XSS por meio da manipulação segura dos elementos do DOM.
- Proteção contra SQL Injection com consultas parametrizadas.
- Validação dos dados recebidos pelo backend.
- Proteção de senhas utilizando bcryptjs.
- Autenticação e proteção de rotas com JWT.
- Limitação de tentativas de login com express-rate-limit.
- Implementação do Helmet para cabeçalhos de segurança.
- Configuração e testes locais de Content Security Policy (CSP).
- Proteção de arquivos sensíveis por meio do `.gitignore`.

**5. Testes e validações**
Foram realizados testes de cadastro, autenticação, criação e edição de tarefas, validação de campos, rejeição de dados inválidos, proteção contra execução de conteúdo HTML malicioso e bloqueio de acesso às rotas protegidas sem autenticação.

### Sobre o histórico de desenvolvimento

Esta implementação possui um novo histórico Git independente, iniciado pelo commit `caf05a6`. Os 12 commits anteriores permanecem preservados na branch `aula02`, correspondentes à versão anterior do projeto.

A nova implementação foi desenvolvida com base no modelo do professor, incorporando uma nova estrutura, utilização do MySQL e melhorias funcionais e de segurança.

**Integrantes:** Maria Isabel, Maria Eduarda, João Pedro e Arthur.

## Extras do código de referência

O código final tem dois recursos que não aparecem nos fascículos e podem ser mostrados como
desafio: o tema claro/escuro e o campo de prazo com destaque para tarefas atrasadas.
