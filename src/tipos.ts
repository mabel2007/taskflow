export type Prioridade = "baixa" | "media" | "alta";

export type Status =
  | "nao_iniciada"
  | "em_andamento"
  | "concluida"
  | "bloqueada";

export interface Tarefa {
  readonly id: number;
  titulo: string;
  descricao?: string | null;
  prioridade: Prioridade;
  status: Status;
  tags: string[];
  prazo?: string | null;
  criadaEm: Date;
}

export type NovaTarefa = Omit<Tarefa, "id" | "status" | "criadaEm">;