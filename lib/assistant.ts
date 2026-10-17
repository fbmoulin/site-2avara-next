import { CONTACT_INFO } from "./constants"

export const ASSISTANT_OPTIONS = [
  { id: "services", label: "Conhecer os serviços" },
  { id: "contact", label: "Solicitar atendimento" },
  { id: "virtual", label: "Acessar o Balcão Virtual" },
] as const

export type AssistantOption = (typeof ASSISTANT_OPTIONS)[number]["id"]
export interface AssistantReply {
  text: string
  links: { label: string; href: string }[]
}

export const ASSISTANT_WELCOME: AssistantReply = {
  text: "Olá! Sou o guia de atendimento da 2ª Vara Cível de Cariacica. Posso orientar sobre os canais disponíveis. Não registro demandas nem reservo horários por esta conversa. Escolha uma opção abaixo; não envie dados de processos aqui.",
  links: [],
}

export function getAssistantReply(option: AssistantOption): AssistantReply {
  switch (option) {
    case "services":
      return {
        text: "Consulte os serviços e as orientações da vara. Para consultar seu processo, utilize o canal indicado na seção de serviços. Este guia não acessa processos nem realiza solicitações.",
        links: [{ label: "Ver serviços", href: "/#servicos" }],
      }
    case "contact":
      return {
        text: `Para solicitar atendimento, utilize o formulário de contato ou os canais da equipe: ${CONTACT_INFO.email} e ${CONTACT_INFO.phone}. O envio de contato não confirma data ou horário. Este guia não realizou nenhum registro ou reserva.`,
        links: [{ label: "Abrir formulário de contato", href: "/#contato" }],
      }
    case "virtual":
      return {
        text: "O Balcão Virtual é o canal de atendimento por videoconferência da secretaria. Acesse a página oficial do TJES para localizar a unidade e as orientações. Este guia não inicia nem agenda uma videoconferência.",
        links: [
          { label: "Balcão Virtual do TJES", href: "https://www.tjes.jus.br/balcao-virtual/" },
        ],
      }
  }
}
