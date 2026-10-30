import { campo, elemento, selecao } from "./dom";
import { tarefas } from "./dados";
import type { Prioridade, Tarefa } from "./tipos";
import { adicionarTarefa, transformar } from "./servicos";

// Identificação do sistema
elemento("nome-do-sistema").textContent = "TaskFlow";
elemento("versao").textContent = "v0.2.0";
elemento("data-de-hoje").textContent =
    new Date().toLocaleDateString("pt-BR");

// O estado do programa: a lista que está valendo agora
const lista: Tarefa[] = [...tarefas];

// Uma tarefa vira um <li> pronto para a tela
function criarItem(tarefa: Tarefa): HTMLLIElement {
    const item = document.createElement("li");
    item.className = `tarefa tarefa--${tarefa.prioridade}`;

    const titulo = document.createElement("h3");
    titulo.className = "tarefa__titulo";
    titulo.textContent = `#${tarefa.id} ${tarefa.titulo}`;

    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${tarefa.prioridade}`;
    etiqueta.textContent = tarefa.prioridade;

    const status = document.createElement("span");
    status.className = `status status--${tarefa.status}`;

    const nomesStatus: Record<Tarefa["status"], string> = {
        nao_iniciada: "Não iniciada",
        em_andamento: "Em andamento",
        concluida: "Concluída",
        bloqueada: "Bloqueada",
    };

    status.textContent = nomesStatus[tarefa.status];

    item.append(titulo, etiqueta, status);

    return item;
}

// A função que desenha a tela inteira a partir da lista
function desenhar(): void {
    const itens = transformar(lista, criarItem);

    elemento("lista").replaceChildren(...itens);

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

    // Atualiza os indicadores adicionais, caso existam no HTML
    const andamento = document.getElementById("em-andamento");
    const concluidasElemento = document.getElementById("concluidas");
    const bloqueadasElemento = document.getElementById("bloqueadas");

    if (andamento) {
        andamento.textContent = String(emAndamento);
    }

    if (concluidasElemento) {
        concluidasElemento.textContent = String(concluidas);
    }

    if (bloqueadasElemento) {
        bloqueadasElemento.textContent = String(bloqueadas);
    }
}

// O formulário: a função abaixo é um CALLBACK
elemento("formulario").addEventListener("submit", (evento) => {
    evento.preventDefault();

    elemento("erro").textContent = "";

    try {
        adicionarTarefa(lista, {
            titulo: campo("titulo").value.trim(),
            prioridade: selecao("prioridade").value as Prioridade,
            tags: [],
        });

        campo("titulo").value = "";

        desenhar();
    } catch (erro) {
        if (erro instanceof Error) {
            elemento("erro").textContent = erro.message;
        }
    }
});

// Desenha a tela ao iniciar o programa
desenhar();