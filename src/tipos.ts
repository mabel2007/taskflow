export type Urgencia = "baixa" | "media" | "alta";

export type StatusChamado =
    | "aberto"
    | "em_atendimento"
    | "resolvido";

export interface Chamado {
    readonly id: number;
    assunto: string;
    descricao?: string | null;
    urgencia: Urgencia;
    status: StatusChamado;
    tags: string[];
    abertoEm: Date;
}

export type NovoChamado = Omit<
    Chamado,
    "id" | "status" | "abertoEm"
>;