// As regras que rodam no navegador, sobre a lista que veio da API.
import type { Contagem, Prioridade, Status, Tarefa } from "./tipos";

// ---------- Aula 2: a SUA função de alta ordem ----------
export function transformar<T, R>(lista: T[], regra: (item: T) => R): R[] {
  const resultado: R[] = [];
  for (const item of lista) {
    resultado.push(regra(item));
  }
  return resultado;
}

// ---------- Aula 6: consultas no front ----------
export function filtrarPorStatus(lista: Tarefa[], status: Status): Tarefa[] {
  return lista.filter((t) => t.status === status);
}

// Procura no título e também nas tags
export function pesquisar(lista: Tarefa[], termo: string): Tarefa[] {
  const procurado = termo.trim().toLowerCase();
  return lista.filter(
    (t) =>
      t.titulo.toLowerCase().includes(procurado) ||
      t.tags.some((tag) => tag.toLowerCase().includes(procurado))
  );
}

export function existeAltaPendente(lista: Tarefa[]): boolean {
  return lista.some((t) => t.prioridade === "alta" && t.status === "pendente");
}

export function todasConcluidas(lista: Tarefa[]): boolean {
  return lista.length > 0 && lista.every((t) => t.status === "concluida");
}

// A versão front do painel. A API faz a mesma conta com GROUP BY.
export function contarPorStatus(lista: Tarefa[]): Contagem {
  return lista.reduce<Contagem>(
    (acumulador, t) => {
      acumulador[t.status]++;
      return acumulador;
    },
    { pendente: 0, em_andamento: 0, concluida: 0 }
  );
}

const pesoPrioridade: Record<Prioridade, number> = { alta: 3, media: 2, baixa: 1 };

export function ordenarPorPrioridade(lista: Tarefa[]): Tarefa[] {
  return [...lista].sort(
    (a, b) =>
      pesoPrioridade[b.prioridade] - pesoPrioridade[a.prioridade] ||
      a.titulo.localeCompare(b.titulo)
  );
}

// Prazo vencido: só conta se a tarefa ainda não foi concluída
export function estaAtrasada(tarefa: Tarefa, hoje: string): boolean {
  return tarefa.status !== "concluida" && !!tarefa.prazo && tarefa.prazo < hoje;
}
