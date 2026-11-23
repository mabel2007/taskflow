
import { campo, elemento, selecao } from "./dom";
import {
  alterarStatus,
  buscarEstatisticas,
  cadastrarTarefa,
  criarConta,
  editarTarefa,
  encerrarSessao,
  entrar,
  guardarSessao,
  listarTarefas,
  removerTarefa,
  sessaoAtual,
} from "./api";
import {
  estaAtrasada,
  existeAltaPendente,
  filtrarPorStatus,
  ordenarPorPrioridade,
  pesquisar,
  todasConcluidas,
} from "./servicos";
import type { Prioridade, Status, Tarefa } from "./tipos";

elemento("nome-do-sistema").textContent = "TaskFlow";
elemento("versao").textContent = "v1.0.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

// ---------- Estado do programa ----------

let lista: Tarefa[] = [];
let statusSelecionado: Status | "todos" = "todos";
let termoDeBusca = "";

// ---------- Mensagens ----------

function mostrarErro(erro: unknown): void {
  elemento("erro").textContent =
    erro instanceof Error ? erro.message : "Erro inesperado.";
}

function mostrarErroEntrada(erro: unknown): void {
  const mensagem =
    erro instanceof Error ? erro.message : "Erro inesperado.";
  elemento("erro-entrada").textContent = mensagem;
}

// ---------- Elementos visuais ----------

function botao(
  texto: string,
  extra: string,
  aoClicar: () => void
): HTMLButtonElement {
  const elementoBotao = document.createElement("button");
  elementoBotao.type = "button";
  elementoBotao.className = `botao botao--pequeno ${extra}`;
  elementoBotao.textContent = texto;
  elementoBotao.addEventListener("click", aoClicar);
  return elementoBotao;
}

function etiqueta(classe: string, texto: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = classe;
  span.textContent = texto;
  return span;
}

// ---------- Modal de edição ----------

function criarCampoModal(
  rotulo: string,
  id: string,
  tipo: "text" | "date" = "text"
): { grupo: HTMLDivElement; input: HTMLInputElement } {
  const grupo = document.createElement("div");
  grupo.className = "modal-campo";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = rotulo;

  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = tipo;

  grupo.append(label, input);

  return { grupo, input };
}

function criarModalEdicao(): {
  dialog: HTMLDialogElement;
  formulario: HTMLFormElement;
  titulo: HTMLInputElement;
  descricao: HTMLTextAreaElement;
  prioridade: HTMLSelectElement;
  prazo: HTMLInputElement;
  tags: HTMLInputElement;
  erro: HTMLParagraphElement;
} {
  const dialog = document.createElement("dialog");
  dialog.className = "taskflow-modal";
  dialog.setAttribute("aria-labelledby", "modal-titulo");

  const formulario = document.createElement("form");
  formulario.className = "modal-formulario";

  const cabecalho = document.createElement("div");
  cabecalho.className = "modal-cabecalho";

  const textosCabecalho = document.createElement("div");

  const subtitulo = document.createElement("span");
  subtitulo.className = "modal-subtitulo";
  subtitulo.textContent = "GERENCIAMENTO DE SUPORTE";

  const tituloModal = document.createElement("h2");
  tituloModal.id = "modal-titulo";
  tituloModal.textContent = "Editar chamado";

  const descricaoCabecalho = document.createElement("p");
  descricaoCabecalho.textContent =
    "Atualize as informações da solicitação.";

  textosCabecalho.append(subtitulo, tituloModal, descricaoCabecalho);

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "modal-fechar";
  fechar.textContent = "×";
  fechar.setAttribute("aria-label", "Fechar janela");
  fechar.addEventListener("click", () => dialog.close());

  cabecalho.append(textosCabecalho, fechar);

  const separador = document.createElement("div");
  separador.className = "modal-separador";

  const { grupo: grupoTitulo, input: titulo } =
    criarCampoModal("Assunto do chamado", "modal-titulo-campo");

  titulo.required = true;
  titulo.minLength = 3;
  titulo.maxLength = 120;
  titulo.placeholder = "Ex.: Erro ao acessar o sistema";

  const grupoDescricao = document.createElement("div");
  grupoDescricao.className = "modal-campo";

  const labelDescricao = document.createElement("label");
  labelDescricao.htmlFor = "modal-descricao";
  labelDescricao.textContent = "Descrição";

  const descricao = document.createElement("textarea");
  descricao.id = "modal-descricao";
  descricao.name = "descricao";
  descricao.rows = 4;
  descricao.placeholder = "Descreva o problema ou a solicitação...";

  grupoDescricao.append(labelDescricao, descricao);

  const linha = document.createElement("div");
  linha.className = "modal-linha";

  const grupoPrioridade = document.createElement("div");
  grupoPrioridade.className = "modal-campo";

  const labelPrioridade = document.createElement("label");
  labelPrioridade.htmlFor = "modal-prioridade";
  labelPrioridade.textContent = "Prioridade";

  const prioridade = document.createElement("select");
  prioridade.id = "modal-prioridade";
  prioridade.name = "prioridade";

  const opcoesPrioridade: { valor: Prioridade; texto: string }[] = [
    { valor: "baixa", texto: "Baixa" },
    { valor: "media", texto: "Média" },
    { valor: "alta", texto: "Alta" },
  ];

  for (const opcao of opcoesPrioridade) {
    const option = document.createElement("option");
    option.value = opcao.valor;
    option.textContent = opcao.texto;
    prioridade.append(option);
  }

  grupoPrioridade.append(labelPrioridade, prioridade);

  const { grupo: grupoPrazo, input: prazo } =
    criarCampoModal("Prazo", "modal-prazo", "date");

  linha.append(grupoPrioridade, grupoPrazo);

  const { grupo: grupoTags, input: tags } =
    criarCampoModal("Categorias / Tags", "modal-tags");

  tags.placeholder = "Ex.: rede, acesso, sistema";

  const ajudaTags = document.createElement("small");
  ajudaTags.textContent = "Separe as categorias por vírgula.";
  grupoTags.append(ajudaTags);

  const erro = document.createElement("p");
  erro.className = "modal-erro";
  erro.setAttribute("role", "alert");
  erro.setAttribute("aria-live", "polite");

  const rodape = document.createElement("div");
  rodape.className = "modal-rodape";

  const cancelar = document.createElement("button");
  cancelar.type = "button";
  cancelar.className = "modal-botao modal-botao--cancelar";
  cancelar.textContent = "Cancelar";
  cancelar.addEventListener("click", () => dialog.close());

  const salvar = document.createElement("button");
  salvar.type = "submit";
  salvar.className = "modal-botao modal-botao--salvar";
  salvar.textContent = "Salvar alterações";

  rodape.append(cancelar, salvar);

  formulario.append(
    cabecalho,
    separador,
    grupoTitulo,
    grupoDescricao,
    linha,
    grupoTags,
    erro,
    rodape
  );

  dialog.append(formulario);
  document.body.append(dialog);

  // Clicar fora do conteúdo também fecha o modal.
  dialog.addEventListener("click", (evento) => {
    if (evento.target === dialog) {
      dialog.close();
    }
  });

  return {
    dialog,
    formulario,
    titulo,
    descricao,
    prioridade,
    prazo,
    tags,
    erro,
  };
}

const modalEdicao = criarModalEdicao();

async function editar(tarefa: Tarefa): Promise<void> {
  const {
    dialog,
    formulario,
    titulo,
    descricao,
    prioridade,
    prazo,
    tags,
    erro,
  } = modalEdicao;

  // Preenche os campos com os dados atuais.
  titulo.value = tarefa.titulo;
  descricao.value = tarefa.descricao ?? "";
  prioridade.value = tarefa.prioridade;
  prazo.value = tarefa.prazo ?? "";
  tags.value = tarefa.tags.join(", ");

  erro.textContent = "";

  const tituloModal = elemento("modal-titulo");
  tituloModal.textContent = `Editar chamado #${tarefa.id}`;

  formulario.dataset.tarefaId = String(tarefa.id);

  if (!dialog.open) {
    dialog.showModal();
  }

  titulo.focus();
}

// ---------- Desenho dos chamados ----------

function criarItem(tarefa: Tarefa): HTMLLIElement {
  const hoje = new Date().toLocaleDateString("en-CA");

  const item = document.createElement("li");
  item.className = `tarefa tarefa--${tarefa.prioridade}`;

  if (tarefa.status === "concluida") {
    item.classList.add("tarefa--concluida");
  }

  if (estaAtrasada(tarefa, hoje)) {
    item.classList.add("tarefa--atrasada");
  }

  const principal = document.createElement("div");
  principal.className = "tarefa__principal";

  const titulo = document.createElement("h3");
  titulo.className = "tarefa__titulo";
  titulo.textContent = `#${tarefa.id} ${tarefa.titulo}`;
  principal.append(titulo);

  if (tarefa.descricao) {
    const descricao = document.createElement("p");
    descricao.className = "tarefa__descricao";
    descricao.textContent = tarefa.descricao;
    principal.append(descricao);
  }

  const meta = document.createElement("div");
  meta.className = "tarefa__meta";

  meta.append(
    etiqueta(`etiqueta etiqueta--${tarefa.prioridade}`, tarefa.prioridade),
    etiqueta("etiqueta etiqueta--status", tarefa.status),
    ...tarefa.tags.map((tag) => etiqueta("tag", tag))
  );

  if (tarefa.prazo) {
    const [ano, mes, dia] = tarefa.prazo.split("-");
    meta.append(etiqueta("tag", `prazo ${dia}/${mes}/${ano}`));
  }

  principal.append(meta);

  const acoes = document.createElement("div");
  acoes.className = "tarefa__acoes";

  if (tarefa.status !== "concluida") {
    acoes.append(
      botao("Em andamento", "", () =>
        mudarStatus(tarefa.id, "em_andamento")
      ),
      botao("Concluir", "botao--sucesso", () =>
        mudarStatus(tarefa.id, "concluida")
      )
    );
  } else {
    acoes.append(
      botao("Reabrir", "", () => mudarStatus(tarefa.id, "pendente"))
    );
  }

  acoes.append(
    botao("Editar", "", () => editar(tarefa)),
    botao("Remover", "botao--perigo", () => remover(tarefa))
  );

  item.append(principal, acoes);
  return item;
}

function tarefasVisiveis(): Tarefa[] {
  let resultado = lista;

  if (statusSelecionado !== "todos") {
    resultado = filtrarPorStatus(resultado, statusSelecionado);
  }

  if (termoDeBusca.trim() !== "") {
    resultado = pesquisar(resultado, termoDeBusca);
  }

  return ordenarPorPrioridade(resultado);
}

async function atualizarPainel(): Promise<void> {
  const contagem = await buscarEstatisticas();

  const total =
    contagem.pendente +
    contagem.em_andamento +
    contagem.concluida;

  elemento("total").textContent = String(total);
  elemento("pendentes").textContent = String(contagem.pendente);
  elemento("em-andamento").textContent = String(contagem.em_andamento);
  elemento("concluidas").textContent = String(contagem.concluida);
}

function desenhar(): void {
  const visiveis = tarefasVisiveis();

  elemento("lista").replaceChildren(...visiveis.map(criarItem));
  elemento("vazio").hidden = visiveis.length > 0;

  elemento("aviso-urgente").classList.toggle(
    "aviso--oculto",
    !existeAltaPendente(lista)
  );

  if (todasConcluidas(lista)) {
    console.log("Parabéns: nenhuma tarefa em aberto!");
  }

  atualizarPainel().catch(mostrarErro);
}

// ---------- Ações dos chamados ----------

async function mudarStatus(id: number, status: Status): Promise<void> {
  try {
    await alterarStatus(id, status);

    lista = lista.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, status } : tarefa
    );

    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function remover(tarefa: Tarefa): Promise<void> {
  if (!confirm(`Remover a tarefa "${tarefa.titulo}"?`)) return;

  try {
    await removerTarefa(tarefa.id);

    lista = lista.filter((item) => item.id !== tarefa.id);
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

// Salvar as alterações do modal.
modalEdicao.formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const id = Number(modalEdicao.formulario.dataset.tarefaId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    modalEdicao.erro.textContent = "Não foi possível identificar o chamado.";
    return;
  }

  const novoTitulo = modalEdicao.titulo.value.trim();

  if (novoTitulo.length < 3 || novoTitulo.length > 120) {
    modalEdicao.erro.textContent =
      "O título deve ter entre 3 e 120 caracteres.";
    modalEdicao.titulo.focus();
    return;
  }

  const dados = {
    titulo: novoTitulo,
    descricao: modalEdicao.descricao.value.trim() || null,
    prioridade: modalEdicao.prioridade.value as Prioridade,
    prazo: modalEdicao.prazo.value || null,
    tags: modalEdicao.tags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ""),
  };

  const botaoSalvar = modalEdicao.formulario.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement;

  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";
  modalEdicao.erro.textContent = "";

  try {
    const atualizada = await editarTarefa(id, dados);

    lista = lista.map((tarefa) =>
      tarefa.id === id ? atualizada : tarefa
    );

    modalEdicao.dialog.close();
    desenhar();
  } catch (erro) {
    modalEdicao.erro.textContent =
      erro instanceof Error ? erro.message : "Não foi possível salvar.";

  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = "Salvar alterações";
  }
});

// ---------- Cadastro de chamados ----------

elemento("formulario").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elemento("erro").textContent = "";

  try {
    const nova = await cadastrarTarefa({
      titulo: campo("titulo").value.trim(),
      prioridade: selecao("prioridade").value as Prioridade,
      prazo: campo("prazo").value || null,
      tags: campo("tags")
        .value.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    });

    lista = [...lista, nova];

    campo("titulo").value = "";
    campo("prazo").value = "";
    campo("tags").value = "";

    campo("titulo").focus();
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

// ---------- Filtros ----------

elemento("filtros-status").addEventListener("click", (evento) => {
  const alvo = evento.target;

  if (!(alvo instanceof HTMLButtonElement)) return;

  const escolhido = alvo.dataset.status;
  if (!escolhido) return;

  statusSelecionado = escolhido as Status | "todos";

  for (const b of elemento("filtros-status").querySelectorAll("button")) {
    b.classList.toggle("filtro--ativo", b === alvo);
  }

  desenhar();
});

campo("busca").addEventListener("input", () => {
  termoDeBusca = campo("busca").value;
  desenhar();
});

// ---------- Tema claro/escuro ----------

function aplicarTema(tema: string): void {
  document.documentElement.dataset.tema = tema;
  localStorage.setItem("taskflow:tema", tema);
}

aplicarTema(localStorage.getItem("taskflow:tema") ?? "claro");

elemento("botao-tema").addEventListener("click", () => {
  aplicarTema(
    document.documentElement.dataset.tema === "escuro"
      ? "claro"
      : "escuro"
  );
});

// ---------- Login e cadastro de usuário ----------

function mostrarFormulario(criando: boolean): void {
  elemento("form-criar").hidden = !criando;
  elemento("form-entrar").hidden = criando;

  elemento("alternar-entrada").textContent = criando
    ? "Já tenho conta"
    : "Ainda não tenho conta";

  elemento("erro-entrada").textContent = "";
}

elemento("alternar-entrada").addEventListener("click", () => {
  mostrarFormulario(elemento("form-criar").hidden === true);
});

elemento("form-entrar").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  try {
    guardarSessao(
      await entrar(
        campo("entrar-email").value,
        campo("entrar-senha").value
      )
    );

    campo("entrar-senha").value = "";
    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("form-criar").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = campo("criar-email").value;
  const senha = campo("criar-senha").value;

  try {
    await criarConta(campo("criar-nome").value, email, senha);

    guardarSessao(await entrar(email, senha));

    (elemento("form-criar") as HTMLFormElement).reset();

    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("botao-sair").addEventListener("click", () => {
  encerrarSessao();
  lista = [];

  (elemento("form-entrar") as HTMLFormElement).reset();
  mostrarFormulario(false);

  iniciar().catch(mostrarErroEntrada);
});

// ---------- Inicialização ----------

async function iniciar(): Promise<void> {
  const sessao = sessaoAtual();

  elemento("tela-entrada").hidden = sessao !== undefined;
  elemento("tela-app").hidden = sessao === undefined;
  elemento("botao-sair").hidden = sessao === undefined;
  elemento("usuario-nome").textContent = sessao?.nome ?? "";

  if (!sessao) return;

  elemento("erro-entrada").textContent = "";

  try {
    lista = await listarTarefas();
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

iniciar().catch(mostrarErro);
