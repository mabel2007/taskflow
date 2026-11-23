
// Todas as conversas com a API ficam aqui (Aulas 5 a 8).
import type {
  Contagem,
  NovaTarefa,
  Sessao,
  Status,
  Tarefa,
  Prioridade,
} from "./tipos";

const CHAVE_SESSAO = "taskflow:sessao";

// ---------- Validações em tempo de execução ----------

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function ehPrioridade(valor: unknown): valor is Prioridade {
  return (
    valor === "baixa" ||
    valor === "media" ||
    valor === "alta"
  );
}

function ehStatus(valor: unknown): valor is Status {
  return (
    valor === "pendente" ||
    valor === "em_andamento" ||
    valor === "concluida"
  );
}

function validarSessao(valor: unknown): Sessao {
  if (
    !ehObjeto(valor) ||
    typeof valor.token !== "string" ||
    valor.token.trim() === "" ||
    typeof valor.nome !== "string"
  ) {
    throw new Error("Dados de sessão inválidos.");
  }

  return {
    token: valor.token,
    nome: valor.nome,
  };
}

function validarTarefa(valor: unknown): Tarefa {
  if (!ehObjeto(valor)) {
    throw new Error("A API retornou uma tarefa inválida.");
  }

  const dataCriacao = new Date(String(valor.criadaEm));

  if (
    !Number.isSafeInteger(valor.id) ||
    (valor.id as number) <= 0 ||
    typeof valor.titulo !== "string" ||
    typeof valor.descricao !== "string" &&
      valor.descricao !== null &&
      valor.descricao !== undefined ||
    !ehPrioridade(valor.prioridade) ||
    !ehStatus(valor.status) ||
    !Array.isArray(valor.tags) ||
    !valor.tags.every((tag) => typeof tag === "string") ||
    typeof valor.prazo !== "string" &&
      valor.prazo !== null &&
      valor.prazo !== undefined ||
    Number.isNaN(dataCriacao.getTime())
  ) {
    throw new Error("A API retornou dados de tarefa inválidos.");
  }

  return {
    id: valor.id as number,
    titulo: valor.titulo,
    descricao: valor.descricao as string | null | undefined,
    prioridade: valor.prioridade,
    status: valor.status,
    tags: valor.tags as string[],
    prazo: valor.prazo as string | null | undefined,
    criadaEm: dataCriacao,
  };
}

function validarContagem(valor: unknown): Contagem {
  if (
    !ehObjeto(valor) ||
    !Number.isSafeInteger(valor.pendente) ||
    (valor.pendente as number) < 0 ||
    !Number.isSafeInteger(valor.em_andamento) ||
    (valor.em_andamento as number) < 0 ||
    !Number.isSafeInteger(valor.concluida) ||
    (valor.concluida as number) < 0
  ) {
    throw new Error("A API retornou estatísticas inválidas.");
  }

  return {
    pendente: valor.pendente as number,
    em_andamento: valor.em_andamento as number,
    concluida: valor.concluida as number,
  };
}

// ---------- Sessão: o token guardado no navegador ----------

export function sessaoAtual(): Sessao | undefined {
  const texto = localStorage.getItem(CHAVE_SESSAO);

  if (!texto) return undefined;

  try {
    const dados: unknown = JSON.parse(texto);
    return validarSessao(dados);
  } catch {
    encerrarSessao();
    return undefined;
  }
}

export function guardarSessao(sessao: Sessao): void {
  const sessaoValidada = validarSessao(sessao);

  localStorage.setItem(
    CHAVE_SESSAO,
    JSON.stringify(sessaoValidada)
  );
}

export function encerrarSessao(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

// ---------- A ajudante que todas as chamadas usam ----------

async function enviar(
  metodo: string,
  url: string,
  corpo?: unknown
): Promise<Response> {
  const sessao = sessaoAtual();

  const resposta = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(sessao
        ? { Authorization: `Bearer ${sessao.token}` }
        : {}),
    },
    body: corpo === undefined
      ? undefined
      : JSON.stringify(corpo),
  });

  // Token vencido ou inválido: encerra a sessão.
  if (resposta.status === 401 && sessao) {
    encerrarSessao();
    location.reload();
  }

  if (!resposta.ok) {
    const dados: unknown = await resposta.json().catch(() => null);

    const mensagem =
      ehObjeto(dados) &&
      typeof dados.erro === "string" &&
      dados.erro.trim() !== ""
        ? dados.erro
        : `Erro ${resposta.status}`;

    throw new Error(mensagem);
  }

  return resposta;
}

// ---------- Tarefas ----------

export async function listarTarefas(): Promise<Tarefa[]> {
  const resposta = await enviar("GET", "/api/tarefas");
  const bruto: unknown = await resposta.json();

  if (!Array.isArray(bruto)) {
    throw new Error("A API retornou uma lista de tarefas inválida.");
  }

  return bruto.map(validarTarefa);
}

export async function buscarTarefa(
  id: number
): Promise<Tarefa | undefined> {
  try {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("Identificador de tarefa inválido.");
    }

    const resposta = await enviar("GET", `/api/tarefas/${id}`);
    const bruto: unknown = await resposta.json();

    return validarTarefa(bruto);
  } catch {
    return undefined;
  }
}

export async function cadastrarTarefa(
  dados: NovaTarefa
): Promise<Tarefa> {
  const resposta = await enviar("POST", "/api/tarefas", dados);
  const bruto: unknown = await resposta.json();

  return validarTarefa(bruto);
}

export async function editarTarefa(
  id: number,
  dados: Partial<NovaTarefa>
): Promise<Tarefa> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de tarefa inválido.");
  }

  const resposta = await enviar(
    "PUT",
    `/api/tarefas/${id}`,
    dados
  );

  const bruto: unknown = await resposta.json();

  return validarTarefa(bruto);
}

export async function alterarStatus(
  id: number,
  status: Status
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de tarefa inválido.");
  }

  if (!ehStatus(status)) {
    throw new Error("Status inválido.");
  }

  await enviar("PATCH", `/api/tarefas/${id}/status`, {
    status,
  });
}

export async function removerTarefa(id: number): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de tarefa inválido.");
  }

  await enviar("DELETE", `/api/tarefas/${id}`);
}

export async function buscarEstatisticas(): Promise<Contagem> {
  const resposta = await enviar("GET", "/api/estatisticas");
  const bruto: unknown = await resposta.json();

  return validarContagem(bruto);
}

// ---------- Usuários ----------

export async function entrar(
  email: string,
  senha: string
): Promise<Sessao> {
  const resposta = await enviar("POST", "/api/login", {
    email,
    senha,
  });

  const bruto: unknown = await resposta.json();

  return validarSessao(bruto);
}

export async function criarConta(
  nome: string,
  email: string,
  senha: string
): Promise<void> {
  await enviar("POST", "/api/usuarios", {
    nome,
    email,
    senha,
  });
}
