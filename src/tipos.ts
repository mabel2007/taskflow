export type Prioridade = "baixa" | "media" | "alta";
export type Status = "pendente" | "em_andamento" | "concluida";

// O espelho da tabela tarefas (Aula 2)
export interface Tarefa {
  readonly id: number;
  titulo: string;
  descricao?: string | null; // no banco: TEXT NULL
  prioridade: Prioridade;
  status: Status;
  tags: string[];
  prazo?: string | null; // "2026-10-22" ou null
  criadaEm: Date;
}

// O que o usuário informa ao cadastrar
export type NovaTarefa = Omit<Tarefa, "id" | "status" | "criadaEm">;

// Os números do painel (Aula 6)
export type Contagem = Record<Status, number>;

// Quem está logado (Aula 5)
export interface Sessao {
  token: string;
  nome: string;
}
