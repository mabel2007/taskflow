
export interface Usuario {
    id: number;
    nome: string;
    email: string;
}

interface RespostaAutenticacao {
    mensagem: string;
    usuario: Usuario;
}

interface RespostaSessao {
    usuario: Usuario;
}

interface RespostaErro {
    erro?: string;
}

class ErroAPI extends Error {
    constructor(
        mensagem: string,
        public readonly status: number
    ) {
        super(mensagem);
        this.name = "ErroAPI";
    }
}

// ======================================
// COMUNICAÇÃO COM O BACKEND
// ======================================

async function requisicaoAPI<T extends object>(
    rota: string,
    metodo: "GET" | "POST",
    dados?: Record<string, unknown>
): Promise<T> {

    let resposta: Response;

    try {
        resposta = await fetch(`/api/auth/${rota}`, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            ...(dados ? {
                body: JSON.stringify(dados)
            } : {})
        });
    } catch {
        throw new Error(
            "Não foi possível conectar ao servidor. Verifique se o backend está iniciado."
        );
    }

    const texto = await resposta.text();

    let resultado: unknown = {};

    if (texto.trim()) {
        try {
            resultado = JSON.parse(texto);
        } catch {
            throw new ErroAPI(
                `O servidor retornou uma resposta inválida. Código HTTP: ${resposta.status}.`,
                resposta.status
            );
        }
    }

    if (!resposta.ok) {
        const dadosErro = resultado as RespostaErro;

        throw new ErroAPI(
            dadosErro.erro ||
            `O servidor retornou um erro HTTP ${resposta.status}.`,
            resposta.status
        );
    }

    if (!texto.trim()) {
        throw new ErroAPI(
            "O servidor respondeu sem enviar os dados esperados.",
            resposta.status
        );
    }

    return resultado as T;
}

// ======================================
// CADASTRO
// ======================================

export async function cadastrarUsuario(
    nome: string,
    email: string,
    senha: string
): Promise<Usuario> {

    const resultado = await requisicaoAPI<RespostaAutenticacao>(
        "cadastro",
        "POST",
        { nome, email, senha }
    );

    return resultado.usuario;
}

// ======================================
// LOGIN
// ======================================

export async function entrarNaConta(
    email: string,
    senha: string
): Promise<Usuario> {

    const resultado = await requisicaoAPI<RespostaAutenticacao>(
        "login",
        "POST",
        { email, senha }
    );

    return resultado.usuario;
}

// ======================================
// CONSULTAR SESSÃO
// ======================================

export async function consultarSessao(): Promise<Usuario | null> {
    try {
        const resultado = await requisicaoAPI<RespostaSessao>(
            "me",
            "GET"
        );

        return resultado.usuario;

    } catch (erro) {
        if (erro instanceof ErroAPI && erro.status === 401) {
            return null;
        }

        throw erro;
    }
}

// ======================================
// LOGOUT
// ======================================

export async function sairDaConta(): Promise<void> {
    await requisicaoAPI<{ mensagem: string }>(
        "logout",
        "POST"
    );
}

