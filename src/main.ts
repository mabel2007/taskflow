
import { campo, elemento, selecao, areaTexto } from "./dom";
import { chamados } from "./dados";
import type { Chamado, StatusChamado, Urgencia } from "./tipos";

import {
    adicionarChamado,
    editarChamado,
    excluirChamado
} from "./servicos";

import {
    cadastrarUsuario,
    entrarNaConta,
    consultarSessao,
    sairDaConta
} from "./auth";

import type { Usuario } from "./auth";

// ========================================
// DADOS E ELEMENTOS PRINCIPAIS
// ========================================

const lista: Chamado[] = [...chamados];

const telaInicial = elemento("tela-inicial");
const painelApp = elemento("painel-app");

const modal = elemento("modal-chamado") as HTMLDialogElement;
const formulario = elemento("formulario") as HTMLFormElement;

const formularioLogin = elemento("form-login") as HTMLFormElement;
const formularioCadastro = elemento("form-cadastro") as HTMLFormElement;

const abaLogin = elemento("aba-login");
const abaCadastro = elemento("aba-cadastro");

const botaoUsuario = elemento("botao-usuario");
const menuUsuario = elemento("menu-usuario");
const botaoOverview = elemento("mostrar-overview");
const overview = elemento("overview-usuario");

let chamadoEmEdicao: number | null = null;
let usuarioAtual: Usuario | null = null;

const nomesStatus: Record<StatusChamado, string> = {
    aberto: "Aberto",
    em_atendimento: "Em atendimento",
    resolvido: "Resolvido"
};

const nomesUrgencia: Record<Urgencia, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta"
};

// ========================================
// DATAS
// ========================================

function dataAtual(): string {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatarData(data: string | Date): string {
    const valor = data instanceof Date ? data : new Date(data);

    if (Number.isNaN(valor.getTime())) {
        return "Não informado";
    }

    return valor.toLocaleDateString("pt-BR");
}

function dataAbertura(chamado: Chamado): string {
    const data = chamado.abertoEm instanceof Date
        ? chamado.abertoEm
        : new Date(chamado.abertoEm);

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// ========================================
// TELA DE LOGIN E CADASTRO
// ========================================

function mostrarFormularioAcesso(
    tipo: "login" | "cadastro"
): void {
    const loginAtivo = tipo === "login";

    formularioLogin.hidden = !loginAtivo;
    formularioCadastro.hidden = loginAtivo;

    abaLogin.classList.toggle("ativa", loginAtivo);
    abaCadastro.classList.toggle("ativa", !loginAtivo);

    abaLogin.setAttribute("aria-selected", String(loginAtivo));
    abaCadastro.setAttribute("aria-selected", String(!loginAtivo));

    elemento("erro-login").textContent = "";
    elemento("erro-cadastro").textContent = "";
}

abaLogin.addEventListener("click", () => {
    mostrarFormularioAcesso("login");
});

abaCadastro.addEventListener("click", () => {
    mostrarFormularioAcesso("cadastro");
});

// ========================================
// AUTENTICAÇÃO E IDENTIFICAÇÃO
// ========================================

function mostrarPainel(usuario: Usuario): void {
    usuarioAtual = usuario;

    telaInicial.hidden = true;
    painelApp.hidden = false;

    elemento("usuario-nome").textContent = usuario.nome;
    elemento("usuario-email").textContent = usuario.email;

    const iniciais = usuario.nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");

    botaoUsuario.textContent = iniciais;
    elemento("usuario-nome").textContent = usuario.nome;

    desenhar();
}

function mostrarTelaInicial(): void {
    usuarioAtual = null;

    painelApp.hidden = true;
    telaInicial.hidden = false;

    fecharMenuUsuario();
    mostrarFormularioAcesso("login");

    formularioLogin.reset();
    formularioCadastro.reset();
}

formularioLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = campo("login-email").value.trim();
    const senha = campo("login-senha").value;

    const erro = elemento("erro-login");
    erro.textContent = "";

    const botao = formularioLogin.querySelector(
        'button[type="submit"]'
    ) as HTMLButtonElement;

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
        const usuario = await entrarNaConta(email, senha);

        mostrarPainel(usuario);
        formularioLogin.reset();

    } catch (erroRecebido) {
        erro.textContent = erroRecebido instanceof Error
            ? erroRecebido.message
            : "Não foi possível entrar na sua conta.";

    } finally {
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});

formularioCadastro.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = campo("cadastro-nome").value.trim();
    const email = campo("cadastro-email").value.trim();
    const senha = campo("cadastro-senha").value;
    const confirmacao = campo("cadastro-confirmacao").value;

    const erro = elemento("erro-cadastro");
    erro.textContent = "";

    if (senha !== confirmacao) {
        erro.textContent = "As senhas não coincidem.";
        campo("cadastro-confirmacao").focus();
        return;
    }

    const botao = formularioCadastro.querySelector(
        'button[type="submit"]'
    ) as HTMLButtonElement;

    botao.disabled = true;
    botao.textContent = "Criando conta...";

    try {
        const usuario = await cadastrarUsuario(nome, email, senha);

        mostrarPainel(usuario);
        formularioCadastro.reset();

    } catch (erroRecebido) {
        erro.textContent = erroRecebido instanceof Error
            ? erroRecebido.message
            : "Não foi possível criar sua conta.";

    } finally {
        botao.disabled = false;
        botao.textContent = "Criar conta";
    }
});

// ========================================
// MENU DO USUÁRIO
// ========================================

function alternarMenuUsuario(): void {
    const aberto = menuUsuario.classList.toggle("aberto");

    botaoUsuario.setAttribute("aria-expanded", String(aberto));
}

function fecharMenuUsuario(): void {
    menuUsuario.classList.remove("aberto");
    botaoUsuario.setAttribute("aria-expanded", "false");
}

function alternarOverview(): void {
    const visivel = overview.classList.toggle("visivel");

    botaoOverview.textContent = visivel
        ? "Ocultar overview"
        : "Mostrar overview";

    atualizarOverview();
}

botaoUsuario.addEventListener("click", (evento) => {
    evento.stopPropagation();
    alternarMenuUsuario();
});

menuUsuario.addEventListener("click", (evento) => {
    evento.stopPropagation();
});

document.addEventListener("click", fecharMenuUsuario);

botaoOverview.addEventListener("click", alternarOverview);

// ========================================
// LOGOUT
// ========================================

elemento("acao-sair").addEventListener("click", async () => {
    try {
        await sairDaConta();

        mostrarTelaInicial();

    } catch (erro) {
        alert(
            erro instanceof Error
                ? erro.message
                : "Não foi possível sair da conta."
        );
    }
});

// ========================================
// OVERVIEW
// ========================================

function atualizarOverview(): void {
    const total = lista.length;

    const abertos = lista.filter(
        (chamado) => chamado.status === "aberto"
    ).length;

    const atendimento = lista.filter(
        (chamado) => chamado.status === "em_atendimento"
    ).length;

    const resolvidos = lista.filter(
        (chamado) => chamado.status === "resolvido"
    ).length;

    elemento("overview-total").textContent = String(total);
    elemento("overview-abertos").textContent = String(abertos);
    elemento("overview-atendimento").textContent = String(atendimento);
    elemento("overview-resolvidos").textContent = String(resolvidos);
}

// ========================================
// MODAL - ABRIR CHAMADO
// ========================================

function abrirCadastro(): void {
    chamadoEmEdicao = null;

    formulario.reset();

    selecao("urgencia").value = "media";
    selecao("status").value = "aberto";

    elemento("titulo-modal").textContent = "Abrir chamado";
    elemento("descricao-modal").textContent =
        "Preencha os dados da solicitação de suporte.";

    elemento("erro").textContent = "";

    modal.showModal();
}

// ========================================
// MODAL - EDITAR CHAMADO
// ========================================

function abrirEdicao(chamado: Chamado): void {
    chamadoEmEdicao = chamado.id;

    campo("assunto").value = chamado.assunto;
    areaTexto("descricao").value = chamado.descricao ?? "";

    selecao("urgencia").value = chamado.urgencia;
    selecao("status").value = chamado.status;

    campo("tags").value = chamado.tags.join(", ");

    elemento("titulo-modal").textContent = "Editar chamado";
    elemento("descricao-modal").textContent =
        "Atualize as informações da solicitação.";

    elemento("erro").textContent = "";

    modal.showModal();
}

// ========================================
// CRIAÇÃO DOS CARTÕES
// ========================================

function criarItem(chamado: Chamado): HTMLElement {
    const cartao = document.createElement("article");

    cartao.className = `chamado chamado--${chamado.urgencia}`;

    const principal = document.createElement("div");
    principal.className = "chamado__principal";

    const titulo = document.createElement("h3");
    titulo.textContent = chamado.assunto;

    principal.appendChild(titulo);

    if (chamado.descricao) {
        const descricao = document.createElement("p");
        descricao.textContent = chamado.descricao;

        principal.appendChild(descricao);
    }

    const metadados = document.createElement("div");
    metadados.className = "chamado__meta";

    const urgencia = document.createElement("span");
    urgencia.className = "etiqueta";
    urgencia.textContent =
        `Urgência: ${nomesUrgencia[chamado.urgencia]}`;

    const status = document.createElement("span");
    status.className = `etiqueta status--${chamado.status}`;
    status.textContent = nomesStatus[chamado.status];

    const abertura = document.createElement("span");
    abertura.className = "etiqueta";
    abertura.textContent =
        `Aberto em: ${formatarData(chamado.abertoEm)}`;

    metadados.append(urgencia, status, abertura);

    for (const tag of chamado.tags) {
        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta";
        etiqueta.textContent = `#${tag}`;

        metadados.appendChild(etiqueta);
    }

    principal.appendChild(metadados);

    const acoes = document.createElement("div");
    acoes.className = "chamado__acoes";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.textContent = "Editar";

    editar.addEventListener("click", () => {
        abrirEdicao(chamado);
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir";

    excluir.addEventListener("click", () => {
        const confirmar = confirm(
            `Deseja realmente excluir o chamado "${chamado.assunto}"?`
        );

        if (confirmar) {
            excluirChamado(lista, chamado.id);
            desenhar();
        }
    });

    acoes.append(editar, excluir);
    cartao.append(principal, acoes);

    return cartao;
}

// ========================================
// INDICADORES
// ========================================

function atualizarIndicadores(): void {
    const total = lista.length;

    const abertos = lista.filter(
        (chamado) => chamado.status === "aberto"
    ).length;

    const atendimento = lista.filter(
        (chamado) => chamado.status === "em_atendimento"
    ).length;

    const resolvidos = lista.filter(
        (chamado) => chamado.status === "resolvido"
    ).length;

    elemento("total").textContent = String(total);
    elemento("abertos").textContent = String(abertos);
    elemento("em-atendimento").textContent = String(atendimento);
    elemento("resolvidos").textContent = String(resolvidos);

    atualizarOverview();
}

// ========================================
// PESQUISA E FILTROS
// ========================================

function desenhar(): void {
    const texto = campo("pesquisa").value.trim().toLowerCase();

    const dataSelecionada = campo("filtro-data").value;
    const urgenciaSelecionada = selecao("filtro-urgencia").value;
    const statusSelecionado = selecao("filtro-status").value;

    const filtradas = lista.filter((chamado) => {
        const correspondeTexto =
            chamado.assunto.toLowerCase().includes(texto) ||
            (chamado.descricao ?? "").toLowerCase().includes(texto) ||
            chamado.tags.some((tag) => tag.toLowerCase().includes(texto));

        const correspondeData =
            !dataSelecionada ||
            dataAbertura(chamado) === dataSelecionada;

        const correspondeUrgencia =
            !urgenciaSelecionada ||
            chamado.urgencia === urgenciaSelecionada;

        const correspondeStatus =
            !statusSelecionado ||
            chamado.status === statusSelecionado;

        return (
            correspondeTexto &&
            correspondeData &&
            correspondeUrgencia &&
            correspondeStatus
        );
    });

    const listaElemento = elemento("lista");
    listaElemento.innerHTML = "";

    for (const chamado of filtradas) {
        listaElemento.appendChild(criarItem(chamado));
    }

    elemento("contador-lista").textContent =
        `${filtradas.length} de ${lista.length} chamado(s)`;

    elemento("comece-por").hidden = filtradas.length > 0;

    atualizarIndicadores();
}

// ========================================
// LIMPAR FILTROS
// ========================================

function limparFiltros(): void {
    campo("pesquisa").value = "";
    campo("filtro-data").value = "";

    selecao("filtro-urgencia").value = "";
    selecao("filtro-status").value = "";

    desenhar();
}

// ========================================
// EVENTOS DOS FILTROS
// ========================================

campo("pesquisa").addEventListener("input", desenhar);
campo("filtro-data").addEventListener("change", desenhar);

selecao("filtro-urgencia").addEventListener("change", desenhar);
selecao("filtro-status").addEventListener("change", desenhar);

elemento("limpar-filtros").addEventListener("click", limparFiltros);

// ========================================
// EVENTOS DO MODAL
// ========================================

elemento("abrir-modal").addEventListener("click", abrirCadastro);

elemento("fechar-modal").addEventListener("click", () => {
    modal.close();
});

elemento("cancelar-modal").addEventListener("click", () => {
    modal.close();
});

formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const assunto = campo("assunto").value.trim();
    const descricao = areaTexto("descricao").value.trim();

    const urgencia = selecao("urgencia").value as Urgencia;
    const status = selecao("status").value as StatusChamado;

    const tags = campo("tags").value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    try {
        if (chamadoEmEdicao !== null) {
            editarChamado(lista, chamadoEmEdicao, {
                assunto,
                descricao,
                urgencia,
                status,
                tags
            });
        } else {
            adicionarChamado(lista, {
                assunto,
                descricao,
                urgencia,
                status,
                tags
            });
        }

        modal.close();
        formulario.reset();

        chamadoEmEdicao = null;

        desenhar();

    } catch (erro) {
        elemento("erro").textContent =
            erro instanceof Error
                ? erro.message
                : "Não foi possível salvar o chamado.";
    }
});

// ========================================
// INICIALIZAÇÃO
// ========================================

async function iniciarAplicacao(): Promise<void> {
    elemento("data-de-hoje").textContent =
        new Date().toLocaleDateString("pt-BR");

    mostrarFormularioAcesso("login");

    try {
        const usuario = await consultarSessao();

        if (usuario) {
            mostrarPainel(usuario);
        } else {
            mostrarTelaInicial();
        }

    } catch (erro) {
        console.error("Erro ao consultar sessão:", erro);

        mostrarTelaInicial();
    }
}

iniciarAplicacao();
