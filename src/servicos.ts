import type {
    NovoChamado,
    Chamado,
    StatusChamado
} from "./tipos";

// Gera o próximo ID a partir do maior ID existente
function gerarId(lista: Chamado[]): number {
    let maior = 0;

    for (const chamado of lista) {
        if (chamado.id > maior) {
            maior = chamado.id;
        }
    }

    return maior + 1;
}

// Cadastra um novo chamado
export function adicionarChamado(
    lista: Chamado[],
    dados: NovoChamado & { status?: StatusChamado }
): Chamado {
    if (dados.assunto.trim().length < 3) {
        throw new Error(
            "O assunto precisa ter pelo menos 3 caracteres."
        );
    }

    const chamado: Chamado = {
        ...dados,
        id: gerarId(lista),
        status: dados.status ?? "aberto",
        abertoEm: new Date()
    };

    lista.push(chamado);

    return chamado;
}

// Campos que podem ser alterados
export type AtualizacaoChamado = Partial<
    Pick<
        Chamado,
        "assunto" | "descricao" | "urgencia" | "status" | "tags"
    >
>;

// Edita um chamado existente
export function editarChamado(
    lista: Chamado[],
    id: number,
    dados: AtualizacaoChamado
): Chamado {
    const chamado = lista.find(
        (item) => item.id === id
    );

    if (!chamado) {
        throw new Error("Chamado não encontrado.");
    }

    if (
        dados.assunto !== undefined &&
        dados.assunto.trim().length < 3
    ) {
        throw new Error(
            "O assunto precisa ter pelo menos 3 caracteres."
        );
    }

    Object.assign(chamado, dados);

    return chamado;
}

// Exclui um chamado pelo ID
export function excluirChamado(
    lista: Chamado[],
    id: number
): boolean {
    const indice = lista.findIndex(
        (item) => item.id === id
    );

    if (indice === -1) {
        return false;
    }

    lista.splice(indice, 1);

    return true;
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