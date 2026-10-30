import { campo, elemento, selecao, areaTexto } from "./dom";
import { tarefas } from "./dados";
import type { Tarefa, Status, Prioridade } from "./tipos";
import {
    adicionarTarefa,
    transformar,
    editarTarefa,
    excluirTarefa
} from "./servicos";

// ========================================
// DADOS E ELEMENTOS PRINCIPAIS
// ========================================

const lista: Tarefa[] = [...tarefas];

const modal = elemento("modal-tarefa") as HTMLDialogElement;
const formulario = elemento("formulario") as HTMLFormElement;

const botaoUsuario = elemento("botao-usuario");
const menuUsuario = elemento("menu-usuario");
const botaoOverview = elemento("mostrar-overview");
const overview = elemento("overview-usuario");

let tarefaEmEdicao: number | null = null;

const nomesStatus: Record<Status, string> = {
    nao_iniciada: "Não iniciada",
    em_andamento: "Em andamento",
    concluida: "Concluída",
    bloqueada: "Bloqueada"
};

const nomesPrioridade: Record<Prioridade, string> = {
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
    if (data instanceof Date) {
        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();

        return `${dia}/${mes}/${ano}`;
    }

    if (!data) return "Não informado";

    const [ano, mes, dia] = data.split("-");

    if (!ano || !mes || !dia) return "Não informado";

    return `${dia}/${mes}/${ano}`;
}

function dataCriacao(tarefa: Tarefa): string {
    const data = tarefa.criadaEm;

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// ========================================
// SITUAÇÃO DO PRAZO
// ========================================

function estaAtrasada(tarefa: Tarefa): boolean {
    return Boolean(
        tarefa.status !== "concluida" &&
        tarefa.prazo &&
        tarefa.prazo < dataAtual()
    );
}

function estaNoPrazo(tarefa: Tarefa): boolean {
    return Boolean(
        tarefa.status !== "concluida" &&
        tarefa.prazo &&
        tarefa.prazo >= dataAtual()
    );
}

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

function atualizarOverview(): void {
    const total = lista.length;

    const concluidas = lista.filter(
        (tarefa) => tarefa.status === "concluida"
    ).length;

    const andamento = lista.filter(
        (tarefa) => tarefa.status === "em_andamento"
    ).length;

    const bloqueadas = lista.filter(
        (tarefa) => tarefa.status === "bloqueada"
    ).length;

    const pendentes = lista.filter(
        (tarefa) => tarefa.status === "nao_iniciada"
    ).length;

    const percentual = total > 0
        ? Math.round((concluidas / total) * 100)
        : 0;

    elemento("overview-total").textContent = String(total);
    elemento("overview-concluidas").textContent = String(concluidas);
    elemento("overview-andamento").textContent = String(andamento);
    elemento("overview-bloqueadas").textContent = String(bloqueadas);
    elemento("overview-pendentes").textContent = String(pendentes);
    elemento("overview-percentual").textContent = `${percentual}%`;
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
// AÇÃO SAIR
// ========================================

elemento("acao-sair").addEventListener("click", () => {
    alert(
        "A autenticação ainda não foi implementada. " +
        "Quando criarmos o login, esta opção encerrará a sessão."
    );

    fecharMenuUsuario();
});

// ========================================
// MODAL - CADASTRO
// ========================================

function abrirCadastro(): void {
    tarefaEmEdicao = null;

    formulario.reset();

    selecao("prioridade").value = "media";
    selecao("status").value = "nao_iniciada";

    elemento("titulo-modal").textContent = "Adicionar tarefa";
    elemento("descricao-modal").textContent =
        "Preencha os dados da nova tarefa.";

    elemento("erro").textContent = "";

    modal.showModal();
}

// ========================================
// MODAL - EDIÇÃO
// ========================================

function abrirEdicao(tarefa: Tarefa): void {
    tarefaEmEdicao = tarefa.id;

    campo("titulo").value = tarefa.titulo;
    areaTexto("descricao").value = tarefa.descricao ?? "";

    selecao("prioridade").value = tarefa.prioridade;
    selecao("status").value = tarefa.status;

    campo("prazo").value = tarefa.prazo ?? "";

    elemento("titulo-modal").textContent = "Editar tarefa";
    elemento("descricao-modal").textContent =
        "Atualize as informações da tarefa.";

    elemento("erro").textContent = "";

    modal.showModal();
}

// ========================================
// CRIAÇÃO DOS CARTÕES
// ========================================

function criarItem(tarefa: Tarefa): HTMLElement {
    const cartao = document.createElement("article");
    cartao.className = `tarefa tarefa--${tarefa.prioridade}`;

    const principal = document.createElement("div");
    principal.className = "tarefa__principal";

    const titulo = document.createElement("h3");
    titulo.textContent = tarefa.titulo;

    principal.appendChild(titulo);

    if (tarefa.descricao) {
        const descricao = document.createElement("p");
        descricao.textContent = tarefa.descricao;
        principal.appendChild(descricao);
    }

    const metadados = document.createElement("div");
    metadados.className = "tarefa__meta";

    const prioridade = document.createElement("span");
    prioridade.className = "etiqueta";
    prioridade.textContent =
        `Prioridade: ${nomesPrioridade[tarefa.prioridade]}`;

    const status = document.createElement("span");
    status.className = `etiqueta status--${tarefa.status}`;
    status.textContent = nomesStatus[tarefa.status];

    const criacao = document.createElement("span");
    criacao.className = "etiqueta";
    criacao.textContent = `Criada em: ${formatarData(tarefa.criadaEm)}`;

    metadados.append(prioridade, status, criacao);

    if (tarefa.prazo) {
        const prazo = document.createElement("span");
        prazo.className = "etiqueta";
        prazo.textContent = `Prazo: ${formatarData(tarefa.prazo)}`;

        metadados.appendChild(prazo);

        if (estaAtrasada(tarefa)) {
            const atraso = document.createElement("span");
            atraso.className = "etiqueta status--bloqueada";
            atraso.textContent = "Em atraso";
            metadados.appendChild(atraso);
        } else if (estaNoPrazo(tarefa)) {
            const noPrazo = document.createElement("span");
            noPrazo.className = "etiqueta status--concluida";
            noPrazo.textContent = "No prazo";
            metadados.appendChild(noPrazo);
        }
    }

    principal.appendChild(metadados);

    const acoes = document.createElement("div");
    acoes.className = "tarefa__acoes";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.textContent = "Editar";

    editar.addEventListener("click", () => {
        abrirEdicao(tarefa);
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.textContent = "Excluir";

    excluir.addEventListener("click", () => {
        const confirmar = confirm(
            `Deseja realmente excluir a tarefa "${tarefa.titulo}"?`
        );

        if (confirmar) {
            excluirTarefa(lista, tarefa.id);
            desenhar();
        }
    });

    acoes.append(editar, excluir);
    cartao.append(principal, acoes);

    return cartao;
}

// ========================================
// INDICADORES PRINCIPAIS
// ========================================

function atualizarIndicadores(): void {
    const total = lista.length;

    const pendentes = lista.filter(
        (tarefa) => tarefa.status === "nao_iniciada"
    ).length;

    const andamento = lista.filter(
        (tarefa) => tarefa.status === "em_andamento"
    ).length;

    const concluidas = lista.filter(
        (tarefa) => tarefa.status === "concluida"
    ).length;

    const bloqueadas = lista.filter(
        (tarefa) => tarefa.status === "bloqueada"
    ).length;

    elemento("total").textContent = String(total);
    elemento("pendentes").textContent = String(pendentes);
    elemento("em-andamento").textContent = String(andamento);
    elemento("concluidas").textContent = String(concluidas);
    elemento("bloqueadas").textContent = String(bloqueadas);

    atualizarOverview();
}

// ========================================
// FILTROS E PESQUISA
// ========================================

function desenhar(): void {
    const texto = campo("pesquisa").value.trim().toLowerCase();

    const dataSelecionada = campo("filtro-data").value;
    const prazoSelecionado = selecao("filtro-prazo").value;
    const prioridadeSelecionada = selecao("filtro-prioridade").value;
    const statusSelecionado = selecao("filtro-status").value;

    const filtradas = lista.filter((tarefa) => {
        const correspondeTexto =
            tarefa.titulo.toLowerCase().includes(texto) ||
            (tarefa.descricao ?? "").toLowerCase().includes(texto);

        const correspondeData =
            !dataSelecionada ||
            dataCriacao(tarefa) === dataSelecionada;

        const correspondePrazo =
            !prazoSelecionado ||
            (prazoSelecionado === "em_atraso" && estaAtrasada(tarefa)) ||
            (prazoSelecionado === "no_prazo" && estaNoPrazo(tarefa));

        const correspondePrioridade =
            !prioridadeSelecionada ||
            tarefa.prioridade === prioridadeSelecionada;

        const correspondeStatus =
            !statusSelecionado ||
            tarefa.status === statusSelecionado;

        return (
            correspondeTexto &&
            correspondeData &&
            correspondePrazo &&
            correspondePrioridade &&
            correspondeStatus
        );
    });

    const listaElemento = elemento("lista");
    listaElemento.innerHTML = "";

    const itens = transformar(filtradas, criarItem);

    for (const item of itens) {
        listaElemento.appendChild(item);
    }

    elemento("contador-lista").textContent =
        `${filtradas.length} de ${lista.length} tarefa(s)`;

    elemento("comece-por").hidden = filtradas.length > 0;

    atualizarIndicadores();
}

// ========================================
// LIMPAR FILTROS
// ========================================

function limparFiltros(): void {
    campo("pesquisa").value = "";
    campo("filtro-data").value = "";

    selecao("filtro-prazo").value = "";
    selecao("filtro-prioridade").value = "";
    selecao("filtro-status").value = "";

    desenhar();
}

// ========================================
// EVENTOS DOS FILTROS
// ========================================

campo("pesquisa").addEventListener("input", desenhar);
campo("filtro-data").addEventListener("change", desenhar);

selecao("filtro-prazo").addEventListener("change", desenhar);
selecao("filtro-prioridade").addEventListener("change", desenhar);
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

    const titulo = campo("titulo").value.trim();
    const descricao = areaTexto("descricao").value.trim();
    const prioridade = selecao("prioridade").value as Prioridade;
    const status = selecao("status").value as Status;
    const prazo = campo("prazo").value || null;

    try {
        if (tarefaEmEdicao !== null) {
            editarTarefa(lista, tarefaEmEdicao, {
                titulo,
                descricao,
                prioridade,
                status,
                prazo
            });
        } else {
            adicionarTarefa(lista, {
                titulo,
                descricao,
                prioridade,
                status,
                prazo,
                tags: []
            });
        }

        modal.close();
        formulario.reset();

        tarefaEmEdicao = null;

        desenhar();

    } catch (erro) {
        elemento("erro").textContent =
            erro instanceof Error
                ? erro.message
                : "Não foi possível salvar a tarefa.";
    }
});

// ========================================
// INICIALIZAÇÃO
// ========================================

elemento("data-de-hoje").textContent =
    new Date().toLocaleDateString("pt-BR");

desenhar();

