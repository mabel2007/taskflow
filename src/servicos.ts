import type { NovaTarefa, Tarefa } from "./tipos";

// Gera o próximo id a partir do maior id já existente
function gerarId(lista: Tarefa[]): number {
  let maior = 0;

  for (const tarefa of lista) {
    if (tarefa.id > maior) {
      maior = tarefa.id;
    }
  }

  return maior + 1;
}

// Cadastra uma tarefa
export function adicionarTarefa(
  lista: Tarefa[],
  dados: NovaTarefa
): Tarefa {
  if (dados.titulo.trim().length < 3) {
    throw new Error("O título precisa ter pelo menos 3 caracteres.");
  }

  const tarefa: Tarefa = {
    ...dados,
    id: gerarId(lista),
    status: "nao_iniciada",
    criadaEm: new Date(),
  };

  lista.push(tarefa);

  return tarefa;
}

// Função de alta ordem
export function transformar<T, R>(
  lista: T[],
  regra: (item: T) => R
): R[] {
  const resultado: R[] = [];

  for (const item of lista) {
    resultado.push(regra(item));
  }

  return resultado;
}
// Campos de uma tarefa que podem ser alterados
export type AtualizacaoTarefa = Partial<
    Pick<
        Tarefa,
        "titulo" | "descricao" | "prioridade" | "status" | "tags" | "prazo"
    >
>;

// Edita uma tarefa existente
export function editarTarefa(
    lista: Tarefa[],
    id: number,
    dados: AtualizacaoTarefa
): Tarefa {
    const tarefa = lista.find((item) => item.id === id);

    if (!tarefa) {
        throw new Error("Tarefa não encontrada.");
    }

    if (
        dados.titulo !== undefined &&
        dados.titulo.trim().length < 3
    ) {
        throw new Error("O título precisa ter pelo menos 3 caracteres.");
    }

    Object.assign(tarefa, dados);

    return tarefa;
}

// Exclui uma tarefa pelo seu ID
export function excluirTarefa(lista: Tarefa[], id: number): boolean {
    const indice = lista.findIndex((item) => item.id === id);

    if (indice === -1) {
        return false;
    }

    lista.splice(indice, 1);

    return true;
}