export type Prioridade = "baixa" | "media" | "alta";
export type Status = "pendente" | "em_andamento" | "concluida";
export interface Tarefa {
readonly id: number;
titulo: string;
descricao?: string | null; // no banco, "sem valor" é NULL
prioridade: Prioridade;
status: Status;
tags: string[];
prazo?: string | null; // NOVO: "2026-10-22" ou null
criadaEm: Date;
}
export type NovaTarefa = Omit<Tarefa, "id" | "status" | "criadaEm">