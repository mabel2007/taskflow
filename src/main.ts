
import { campo, elemento, selecao } from "./dom";
import { tarefas } from "./dados";
import type { Prioridade, Tarefa } from "./tipos";

import {
    adicionarTarefa,
    transformar,
    editarTarefa,
    excluirTarefa
} from "./servicos";

// Identificação do sistema
elemento("nome-do-sistema").textContent = "TaskFlow";
elemento("versao").textContent = "v0.2.0";
elemento("data-de-hoje").textContent =
    new Date().toLocaleDateString("pt-BR");

// Estado atual das tarefas
const lista: Tarefa[] = [...tarefas];

let tarefaEmEdicao: number | null = null;

// Elementos do modal
const modal = document.getElementById(
    "modal-tarefa"
) as HTMLDialogElement;

const tituloModal = elemento("titulo-modal");
const descricaoModal = elemento("descricao-modal");

const campoDescricao = document.getElementById(
    "descricao"
) as HTMLTextAreaElement;

const campoPrazo = document.getElementById(
    "prazo"
) as HTMLInputElement;

const campoPesquisa = document.getElementById(
    "pesquisa"
) as HTMLInputElement;

// Nomes dos status
const nomesStatus: Record<Tarefa["status"], string> = {
    nao_iniciada: "Não iniciada",
    em_andamento: "Em andamento",
    concluida: "Concluída",
    bloqueada: "Bloqueada",
};

// Retorna a data atual no formato YYYY-MM-DD
function dataAtual(): string {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

// Formata a data para o padrão brasileiro
function formatarData(data: string): string {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Verifica se a tarefa está atrasada
function estaAtrasada(tarefa: Tarefa): boolean {
    return (
        tarefa.status !== "concluida" &&
        !!tarefa.prazo &&
        tarefa.prazo < dataAtual()
    );
}

// Abre o modal para uma nova tarefa
function abrirCadastro(): void {
    tarefaEmEdicao = null;

    elemento("formulario").querySelector("form");

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

// Abre o modal preenchido para edição
function abrirEdicao(tarefa: Tarefa): void {
    tarefaEmEdicao = tarefa.id;

    campo("titulo").value = tarefa.titulo;
    campoDescricao.value = tarefa.descricao || "";
    campoPrazo.value = tarefa.prazo || "";

    selecao("prioridade").value = tarefa.prioridade;
    selecao("status").value = tarefa.status;

    tituloModal.textContent = "Editar tarefa";
    descricaoModal.textContent =
        "Altere as informações da atividade selecionada.";

    elemento("salvar-tarefa").textContent = "Salvar alterações";
    elemento("erro").textContent = "";

    modal.showModal();

    campo("titulo").focus();
}

// Fecha e limpa o modal
function fecharModal(): void {
    modal.close();
}

// Cria o cartão de uma tarefa
function criarItem(tarefa: Tarefa): HTMLLIElement {
    const item = document.createElement("li");

    item.className = `tarefa tarefa--${tarefa.prioridade}`;

    if (tarefa.status === "concluida") {
        item.classList.add("tarefa--concluida");
    }

    if (estaAtrasada(tarefa)) {
        item.classList.add("tarefa--atrasada");
    }

    // Área principal
    const principal = document.createElement("div");
    principal.className = "tarefa__principal";

    const titulo = document.createElement("h3");
    titulo.className = "tarefa__titulo";
    titulo.textContent = `#${tarefa.id} ${tarefa.titulo}`;

    const descricao = document.createElement("p");
    descricao.className = "tarefa__descricao";
    descricao.textContent = tarefa.descricao || "Sem descrição";

    // Informações
    const meta = document.createElement("div");
    meta.className = "tarefa__meta";

    const prioridade = document.createElement("span");
    prioridade.className =
        `etiqueta etiqueta--${tarefa.prioridade}`;
    prioridade.textContent =
        `Prioridade: ${tarefa.prioridade}`;

    const status = document.createElement("span");
    status.className =
        `etiqueta etiqueta--status status--${tarefa.status}`;
    status.textContent = nomesStatus[tarefa.status];

    meta.append(prioridade, status);

    // Prazo
    if (tarefa.prazo) {
        const prazo = document.createElement("span");
        prazo.className = "etiqueta";
        prazo.textContent =
            `Prazo: ${formatarData(tarefa.prazo)}`;

        meta.append(prazo);

        const situacao = document.createElement("span");

        if (tarefa.status === "concluida") {
            situacao.className = "etiqueta etiqueta--baixa";
            situacao.textContent = "Concluída";
        } else if (estaAtrasada(tarefa)) {
            situacao.className = "etiqueta etiqueta--alta";
            situacao.textContent = "Atrasada";
        } else {
            situacao.className = "etiqueta etiqueta--baixa";
            situacao.textContent = "No prazo";
        }

        meta.append(situacao);
    }

    principal.append(titulo, descricao, meta);

    // Botões de ação
    const acoes = document.createElement("div");
    acoes.className = "tarefa__acoes";

    const botaoEditar = document.createElement("button");
    botaoEditar.className = "botao botao--pequeno";
    botaoEditar.textContent = "Editar";
    botaoEditar.type = "button";

    botaoEditar.addEventListener("click", () => {
        abrirEdicao(tarefa);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.className =
        "botao botao--pequeno botao--perigo";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.type = "button";

    botaoExcluir.addEventListener("click", () => {
        const confirmou = confirm(
            `Deseja realmente excluir "${tarefa.titulo}"?`
        );

        if (confirmou) {
            excluirTarefa(lista, tarefa.id);
            desenhar();
        }
    });

    acoes.append(botaoEditar, botaoExcluir);
    item.append(principal, acoes);

    return item;
}

// Desenha a lista e atualiza os indicadores
function desenhar(): void {
    const termo = campoPesquisa.value.trim().toLocaleLowerCase("pt-BR");

    const tarefasFiltradas = lista.filter((tarefa) => {
        const titulo = tarefa.titulo.toLocaleLowerCase("pt-BR");
        const descricao = (tarefa.descricao || "")
            .toLocaleLowerCase("pt-BR");

        return titulo.includes(termo) || descricao.includes(termo);
    });

    const itens = transformar(tarefasFiltradas, criarItem);

    elemento("lista").replaceChildren(...itens);

    // Indicadores: sempre calculados sobre todas as tarefas
    let naoIniciadas = 0;
    let emAndamento = 0;
    let concluidas = 0;
    let bloqueadas = 0;

    for (const tarefa of lista) {
        if (tarefa.status === "nao_iniciada") {
            naoIniciadas++;
        } else if (tarefa.status === "em_andamento") {
            emAndamento++;
        } else if (tarefa.status === "concluida") {
            concluidas++;
        } else if (tarefa.status === "bloqueada") {
            bloqueadas++;
        }
    }

    elemento("total").textContent = String(lista.length);
    elemento("pendentes").textContent = String(naoIniciadas);
    elemento("em-andamento").textContent = String(emAndamento);
    elemento("concluidas").textContent = String(concluidas);
    elemento("bloqueadas").textContent = String(bloqueadas);

    // Contagem dos resultados da pesquisa
    const contador = document.getElementById("contador-lista");

    if (contador) {
        contador.textContent =
            tarefasFiltradas.length === 1
                ? "1 tarefa"
                : `${tarefasFiltradas.length} tarefas`;
    }

    // Mensagens da lista
    const aviso = document.getElementById(
        "comece-por"
    ) as HTMLParagraphElement;

    if (lista.length === 0) {
        aviso.textContent =
            "Você ainda não possui tarefas. Adicione sua primeira atividade!";
        aviso.hidden = false;
    } else if (tarefasFiltradas.length === 0) {
        aviso.textContent =
            "Nenhuma tarefa encontrada para essa pesquisa.";
        aviso.hidden = false;
    } else {
        aviso.hidden = true;
    }
}

// Abre o modal pelo botão de adicionar
elemento("abrir-modal").addEventListener("click", abrirCadastro);

// Fecha o modal pelos botões
elemento("fechar-modal").addEventListener("click", fecharModal);
elemento("cancelar-modal").addEventListener("click", fecharModal);

// Fecha o modal ao clicar fora da janela
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
        fecharModal();
    }
});

// Limpa o estado de edição quando o modal é fechado
modal.addEventListener("close", () => {
    tarefaEmEdicao = null;
});

// Pesquisa em tempo real
campoPesquisa.addEventListener("input", desenhar);

// Cadastro e edição
elemento("formulario").addEventListener("submit", (evento) => {
    evento.preventDefault();

    elemento("erro").textContent = "";

    const dados = {
        titulo: campo("titulo").value.trim(),
        descricao: campoDescricao.value.trim() || null,
        prioridade: selecao("prioridade").value as Prioridade,
        status: selecao("status").value as Tarefa["status"],
        prazo: campoPrazo.value || null,
        tags: tarefaEmEdicao !== null
            ? lista.find((tarefa) => tarefa.id === tarefaEmEdicao)?.tags ?? []
            : [],
    };

    try {
        if (tarefaEmEdicao !== null) {
            editarTarefa(lista, tarefaEmEdicao, dados);
        } else {
            adicionarTarefa(lista, dados);
        }

        modal.close();
        desenhar();

    } catch (erro) {
        if (erro instanceof Error) {
            elemento("erro").textContent = erro.message;
        }
    }
});

// Desenha a tela inicial
desenhar();


