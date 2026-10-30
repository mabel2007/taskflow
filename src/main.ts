
import { campo, elemento, selecao } from "./dom";
import { tarefas } from "./dados";
import type { Tarefa } from "./tipos";

import {
    adicionarTarefa,
    transformar,
    editarTarefa,
    excluirTarefa
} from "./servicos";

// Informações do sistema
elemento("nome-do-sistema").textContent = "TaskFlow";
elemento("versao").textContent = "v0.2.0";
elemento("data-de-hoje").textContent =
    new Date().toLocaleDateString("pt-BR");

// Lista de tarefas em memória
const lista: Tarefa[] = [...tarefas];

let tarefaEmEdicao: number | null = null;

// Elementos do modal
const modal = document.getElementById("modal-tarefa") as HTMLDialogElement;

const tituloModal = elemento("titulo-modal");
const descricaoModal = elemento("descricao-modal");

const campoDescricao =
    document.getElementById("descricao") as HTMLTextAreaElement;

const campoPrazo =
    document.getElementById("prazo") as HTMLInputElement;

// Elementos dos filtros
const campoPesquisa =
    document.getElementById("pesquisa") as HTMLInputElement;

const filtroData =
    document.getElementById("filtro-data") as HTMLInputElement;

const filtroPrazo =
    document.getElementById("filtro-prazo") as HTMLSelectElement;

const filtroPrioridade =
    document.getElementById("filtro-prioridade") as HTMLSelectElement;

const filtroStatus =
    document.getElementById("filtro-status") as HTMLSelectElement;

// Nomes apresentados na tela
const nomesStatus: Record<Tarefa["status"], string> = {
    nao_iniciada: "Não iniciada",
    em_andamento: "Em andamento",
    concluida: "Concluída",
    bloqueada: "Bloqueada"
};

const nomesPrioridade: Record<Tarefa["prioridade"], string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta"
};

// Retorna a data atual no formato YYYY-MM-DD
function dataAtual(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Converte uma data para o formato brasileiro
function formatarData(data: string | Date): string {
    const valor = typeof data === "string"
        ? data
        : data.toISOString().slice(0, 10);

    if (!valor) return "Não definido";

    const [ano, mes, dia] = valor.split("-");

    return `${dia}/${mes}/${ano}`;
}

// Converte a data de criação para YYYY-MM-DD
function dataCriacao(tarefa: Tarefa): string {
    const data = new Date(tarefa.criadaEm);

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Verifica se a tarefa está atrasada
function estaAtrasada(tarefa: Tarefa): boolean {
    return (
        tarefa.status !== "concluida" &&
        !!tarefa.prazo &&
        tarefa.prazo < dataAtual()
    );
}

// Verifica se a tarefa está no prazo
function estaNoPrazo(tarefa: Tarefa): boolean {
    return (
        tarefa.status !== "concluida" &&
        !!tarefa.prazo &&
        tarefa.prazo >= dataAtual()
    );
}

// Abre o modal para cadastrar uma tarefa
function abrirCadastro(): void {
    tarefaEmEdicao = null;

    campo("titulo").value = "";
    campoDescricao.value = "";
    campoPrazo.value = "";

    selecao("prioridade").value = "media";
    selecao("status").value = "nao_iniciada";

    tituloModal.textContent = "Nova tarefa";
    descricaoModal.textContent =
        "Preencha as informações da sua atividade.";

    elemento("salvar-tarefa").textContent = "Salvar tarefa";
    elemento("erro").textContent = "";

    modal.showModal();
    campo("titulo").focus();
}

// Abre o modal para editar uma tarefa
function abrirEdicao(tarefa: Tarefa): void {
    tarefaEmEdicao = tarefa.id;

    campo("titulo").value = tarefa.titulo;
    campoDescricao.value = tarefa.descricao ?? "";
    campoPrazo.value = tarefa.prazo ?? "";

    selecao("prioridade").value = tarefa.prioridade;
    selecao("status").value = tarefa.status;

    tituloModal.textContent = "Editar tarefa";
    descricaoModal.textContent =
        "Altere as informações da sua atividade.";

    elemento("salvar-tarefa").textContent = "Salvar alterações";
    elemento("erro").textContent = "";

    modal.showModal();
    campo("titulo").focus();
}

// Fecha o modal
function fecharModal(): void {
    modal.close();
}

// Cria o cartão visual de uma tarefa
function criarItem(tarefa: Tarefa): HTMLLIElement {
    const item = document.createElement("li");

    item.className = `tarefa tarefa--${tarefa.prioridade}`;

    if (tarefa.status === "concluida") {
        item.classList.add("tarefa--concluida");
    }

    if (estaAtrasada(tarefa)) {
        item.classList.add("tarefa--atrasada");
    }

    const cabecalho = document.createElement("div");
    cabecalho.className = "tarefa__cabecalho";

    const titulo = document.createElement("h3");
    titulo.className = "tarefa__titulo";
    titulo.textContent = tarefa.titulo;

    const prioridade = document.createElement("span");
    prioridade.className = `etiqueta etiqueta--${tarefa.prioridade}`;
    prioridade.textContent =
        `Prioridade: ${nomesPrioridade[tarefa.prioridade]}`;

    cabecalho.append(titulo, prioridade);

    const descricao = document.createElement("p");
    descricao.className = "tarefa__descricao";
    descricao.textContent = tarefa.descricao || "Sem descrição.";

    const informacoes = document.createElement("div");
    informacoes.className = "tarefa__informacoes";

    const status = document.createElement("span");
    status.className = `etiqueta etiqueta--status-${tarefa.status}`;
    status.textContent = `Status: ${nomesStatus[tarefa.status]}`;

    const criacao = document.createElement("span");
    criacao.textContent =
        `Criada em: ${formatarData(dataCriacao(tarefa))}`;

    const prazo = document.createElement("span");

    if (tarefa.prazo) {
        prazo.textContent = `Prazo final: ${formatarData(tarefa.prazo)}`;
    } else {
        prazo.textContent = "Prazo final: Não definido";
    }

    informacoes.append(status, criacao, prazo);

    const situacaoPrazo = document.createElement("span");
    situacaoPrazo.className = "tarefa__situacao";

    if (estaAtrasada(tarefa)) {
        situacaoPrazo.textContent = "Em atraso";
        situacaoPrazo.classList.add("situacao--atrasada");
    } else if (estaNoPrazo(tarefa)) {
        situacaoPrazo.textContent = "No prazo";
        situacaoPrazo.classList.add("situacao--no-prazo");
    } else if (tarefa.status === "concluida") {
        situacaoPrazo.textContent = "Concluída";
    } else {
        situacaoPrazo.textContent = "Sem prazo definido";
    }

    const acoes = document.createElement("div");
    acoes.className = "tarefa__acoes";

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.textContent = "Editar";
    botaoEditar.addEventListener("click", () => abrirEdicao(tarefa));

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.textContent = "Excluir";

    botaoExcluir.addEventListener("click", () => {
        const confirmar = window.confirm(
            `Deseja realmente excluir a tarefa "${tarefa.titulo}"?`
        );

        if (!confirmar) return;

        excluirTarefa(lista, tarefa.id);
        desenhar();
    });

    acoes.append(botaoEditar, botaoExcluir);

    item.append(
        cabecalho,
        descricao,
        informacoes,
        situacaoPrazo,
        acoes
    );

    return item;
}

// Atualiza os indicadores gerais
function atualizarIndicadores(): void {
    elemento("total").textContent = String(lista.length);

    elemento("pendentes").textContent = String(
        lista.filter(t => t.status === "nao_iniciada").length
    );

    elemento("em-andamento").textContent = String(
        lista.filter(t => t.status === "em_andamento").length
    );

    elemento("concluidas").textContent = String(
        lista.filter(t => t.status === "concluida").length
    );

    elemento("bloqueadas").textContent = String(
        lista.filter(t => t.status === "bloqueada").length
    );
}

// Aplica os filtros e desenha a lista
function desenhar(): void {
    const pesquisa = campoPesquisa.value
        .trim()
        .toLocaleLowerCase("pt-BR");

    const dataSelecionada = filtroData.value;
    const prazoSelecionado = filtroPrazo.value;
    const prioridadeSelecionada = filtroPrioridade.value;
    const statusSelecionado = filtroStatus.value;

    const filtradas = lista.filter(tarefa => {
        // Pesquisa por título ou descrição
        const correspondePesquisa =
            tarefa.titulo.toLocaleLowerCase("pt-BR").includes(pesquisa) ||
            (tarefa.descricao ?? "")
                .toLocaleLowerCase("pt-BR")
                .includes(pesquisa);

        // Filtro pela data de criação
        const correspondeData =
            !dataSelecionada ||
            dataCriacao(tarefa) === dataSelecionada;

        // Filtro pela situação do prazo
        let correspondePrazo = true;

        if (prazoSelecionado === "no_prazo") {
            correspondePrazo = estaNoPrazo(tarefa);
        } else if (prazoSelecionado === "em_atraso") {
            correspondePrazo = estaAtrasada(tarefa);
        }

        // Filtro pela prioridade
        const correspondePrioridade =
            !prioridadeSelecionada ||
            tarefa.prioridade === prioridadeSelecionada;

        // Filtro pelo status
        const correspondeStatus =
            !statusSelecionado ||
            tarefa.status === statusSelecionado;

        return (
            correspondePesquisa &&
            correspondeData &&
            correspondePrazo &&
            correspondePrioridade &&
            correspondeStatus
        );
    });

    const itens = transformar(filtradas, criarItem);

    const listaElemento = elemento("lista") as HTMLUListElement;
    listaElemento.replaceChildren(...itens);

    const aviso = elemento("comece-por");

    aviso.hidden = filtradas.length > 0;

    elemento("contador-lista").textContent =
        `${filtradas.length} ${filtradas.length === 1 ? "tarefa" : "tarefas"}`;

    atualizarIndicadores();
}

// Limpa todos os filtros
function limparFiltros(): void {
    campoPesquisa.value = "";
    filtroData.value = "";
    filtroPrazo.value = "";
    filtroPrioridade.value = "";
    filtroStatus.value = "";

    desenhar();
}

// Eventos dos botões do modal
elemento("abrir-modal").addEventListener("click", abrirCadastro);
elemento("fechar-modal").addEventListener("click", fecharModal);
elemento("cancelar-modal").addEventListener("click", fecharModal);

// Fecha o modal ao clicar fora do conteúdo
modal.addEventListener("click", (evento: MouseEvent) => {
    if (evento.target === modal) {
        fecharModal();
    }
});

// Eventos dos filtros
campoPesquisa.addEventListener("input", desenhar);
filtroData.addEventListener("change", desenhar);
filtroPrazo.addEventListener("change", desenhar);
filtroPrioridade.addEventListener("change", desenhar);
filtroStatus.addEventListener("change", desenhar);

elemento("limpar-filtros").addEventListener("click", limparFiltros);

// Cadastro e edição de tarefas
elemento("formulario").addEventListener("submit", (evento: SubmitEvent) => {
    evento.preventDefault();

    const dados = {
        titulo: campo("titulo").value.trim(),
        descricao: campoDescricao.value.trim(),
        prioridade: selecao("prioridade").value as Tarefa["prioridade"],
        status: selecao("status").value as Tarefa["status"],
        prazo: campoPrazo.value || null,
        tags: []
    };

    try {
        if (tarefaEmEdicao !== null) {
            editarTarefa(lista, tarefaEmEdicao, dados);
        } else {
            adicionarTarefa(lista, dados);
        }

        fecharModal();
        desenhar();

    } catch (erro) {
        elemento("erro").textContent =
            erro instanceof Error
                ? erro.message
                : "Não foi possível salvar a tarefa.";
    }
});

// Primeira exibição
desenhar();


