import type { Chamado } from "./tipos";

export const chamados: Chamado[] = [
    {
        id: 1,
        assunto: "Erro ao acessar o sistema",
        descricao: "Usuário não consegue realizar login na plataforma.",
        urgencia: "alta",
        status: "aberto",
        tags: ["acesso", "sistema"],
        abertoEm: new Date()
    },
    {
        id: 2,
        assunto: "Solicitação de redefinição de senha",
        descricao: "Usuário esqueceu a senha e precisa recuperar o acesso.",
        urgencia: "baixa",
        status: "resolvido",
        tags: ["acesso", "senha"],
        abertoEm: new Date()
    },
    {
        id: 3,
        assunto: "Sistema apresentando lentidão",
        descricao: "A plataforma demora para carregar as informações.",
        urgencia: "alta",
        status: "em_atendimento",
        tags: ["sistema", "desempenho"],
        abertoEm: new Date()
    },
    {
        id: 4,
        assunto: "Falha na conexão com a rede",
        descricao: "Computador não consegue acessar a rede interna.",
        urgencia: "media",
        status: "aberto",
        tags: ["rede", "conectividade"],
        abertoEm: new Date()
    },
    {
        id: 5,
        assunto: "Instalação de software",
        descricao: "Solicitação de instalação de um programa de trabalho.",
        urgencia: "media",
        status: "em_atendimento",
        tags: ["software", "instalação"],
        abertoEm: new Date()
    },
    {
        id: 6,
        assunto: "Problema com impressora",
        descricao: "Impressora não está respondendo aos comandos de impressão.",
        urgencia: "baixa",
        status: "aberto",
        tags: ["hardware", "impressora"],
        abertoEm: new Date()
    }
];