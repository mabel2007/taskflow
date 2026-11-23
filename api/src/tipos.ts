export type Prioridade = "baixa" | "media" | "alta";
export type Status = "pendente" | "em_andamento" | "concluida";

export const PRIORIDADES: Prioridade[] = ["baixa", "media", "alta"];
export const STATUS: Status[] = ["pendente", "em_andamento", "concluida"];

// O que chega no corpo de POST e PUT. Tudo é opcional porque
// quem manda é o navegador: a API confere antes de usar.
export interface DadosTarefa {
  titulo?: string;
  descricao?: string | null;
  prioridade?: Prioridade;
  prazo?: string | null;
  tags?: string[];
}
