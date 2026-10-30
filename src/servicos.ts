import type { NovaTarefa, Tarefa } from "./tipos";
// Gera o próximo id a partir do maior id já existente
function gerarId(lista: Tarefa[]): number {
let maior = 0;
for (const tarefa of lista) {
if (tarefa.id > maior) {
maior = tarefa.id;
}
}
return maior + 1;
}
// Cadastra uma tarefa: o usuário informa só o essencial
export function adicionarTarefa(lista: Tarefa[], dados: NovaTarefa): Tarefa {
if (dados.titulo.trim().length < 3) {
throw new Error("O título precisa ter pelo menos 3 caracteres.");
}
const tarefa: Tarefa = {
...dados,
id: gerarId(lista),
status: "pendente",
criadaEm: new Date(),
};
lista.push(tarefa);
return tarefa;
}
// A SUA função de alta ordem: recebe uma lista e uma regra
export function transformar<T, R>(lista: T[], regra: (item: T) => R): R[] {
const resultado: R[] = [];
for (const item of lista) {
resultado.push(regra(item));
}
return resultado;
}