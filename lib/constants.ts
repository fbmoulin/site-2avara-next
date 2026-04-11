export interface ServiceLink {
  label: string
  url: string
  icon: string
}

export interface ServiceItem {
  id: string
  title: string
  description: string
  icon: string
  url?: string
  links?: ServiceLink[]
  tutorial?: string[]
  tutorialTip?: string
}

export interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

export const SERVICES: ServiceItem[] = [
  {
    id: "1",
    title: "Consulta Processual",
    description:
      "Acesse o andamento atualizado dos seus processos judiciais.",
    icon: "search",
    url: "https://sso.cloud.pje.jus.br/auth/realms/pje/protocol/openid-connect/auth?client_id=portalexterno-frontend&redirect_uri=https%3A%2F%2Fportaldeservicos.pdpj.jus.br%2Fconsulta&state=843bfcd9-02b7-4103-8046-614b7d4f4258&response_mode=fragment&response_type=code&scope=openid&nonce=37a449bc-09a8-4d96-8b22-2ec1e7df8c34",
  },
  {
    id: "3",
    title: "Balcão Virtual",
    description:
      "Atendimento online por videoconferência com a secretaria da vara. Tire dúvidas, solicite informações e obtenha orientações sem sair de casa.",
    icon: "video",
    url: "https://www.tjes.jus.br/balcao-virtual/",
  },
  {
    id: "2",
    title: "Audiências Virtuais",
    description:
      "As audiências virtuais são realizadas por meio do Aplicativo Zoom. Baixe e instale o aplicativo no seu celular com antecedência para evitar atrasos, por meio dos links abaixo:",
    icon: "video",
    links: [
      {
        label: "App Store (iOS)",
        url: "https://apps.apple.com/br/app/zoom-one-platform-to-connect/id546505307",
        icon: "apple",
      },
      {
        label: "Google Play (Android)",
        url: "https://play.google.com/store/apps/details?id=us.zoom.videomeetings",
        icon: "playstore",
      },
    ],
    tutorial: [
      "Clique no link da audiência recebido por e-mail ou WhatsApp no dia e hora marcados.",
      "Ao entrar, selecione 'Dados de rede WiFi ou móvel' (celular) ou 'Entrar com Áudio do Computador' (PC).",
      "Permita o acesso à câmera e ao microfone quando solicitado.",
      "Mantenha o microfone desligado e só ative quando for falar.",
      "Aguarde na sala de espera até o servidor autorizar sua entrada.",
    ],
    tutorialTip:
      "Dica: Entre na sala com pelo menos 10 minutos de antecedência e teste seu áudio antes da audiência.",
  },
  {
    id: "4",
    title: "Solicitações e Agendamento",
    description:
      "Você pode registrar sua demanda ou fazer uma solicitação por meio de um dos canais disponíveis nesta página. Nossa equipe analisará sua solicitação e entrará em contato o mais breve possível.",
    icon: "calendar",
    links: [
      { label: "Preencher Formulário", url: "#contact", icon: "file-text" },
      { label: "Agendar via Chat", url: "#chatbot", icon: "message-square" },
    ],
  },
]

export const FAQS: FaqItem[] = [
  {
    id: "1",
    category: "Geral",
    question: "Qual o horário de atendimento presencial?",
    answer:
      "O atendimento presencial ocorre de segunda a sexta-feira, das 12h às 18h, exceto feriados.",
  },
  {
    id: "2",
    category: "Processual",
    question: "Como faço para consultar meu processo?",
    answer:
      'A consulta pode ser realizada através da opção "Consulta Processual" neste site, utilizando o número do processo ou nome das partes.',
  },
  {
    id: "3",
    category: "Audiências",
    question: "As audiências são presenciais ou virtuais?",
    answer:
      "Atualmente, as audiências ocorrem geralmente em formato híbrido, ou seja, de forma presencial e virtual ao mesmo tempo. Verifique a sua intimação para confirmar a modalidade específica do seu caso. Se houver dúvidas, entre em contato através de um dos canais de contato desta página.",
  },
  {
    id: "4",
    category: "Contato",
    question:
      "Como entro em contato com a Assessoria do Gabinete ou com o Juiz?",
    answer:
      "O atendimento com a Assessoria do Gabinete da 2ª Vara Cível ou com o Juiz Titular pode ser previamente agendado por meio de um dos canais disponíveis nesta página: preenchendo um formulário, enviando um e-mail ou por meio do Chat.",
  },
  {
    id: "5",
    category: "Solicitações",
    question:
      "Como faço para registrar minha demanda ou fazer uma solicitação?",
    answer:
      "Você pode registrar sua demanda ou fazer uma solicitação por meio de um dos canais disponíveis nesta página: preenchendo o formulário de contato, enviando um e-mail para a secretaria ou utilizando o Chat. Nossa equipe analisará sua solicitação e entrará em contato o mais breve possível.",
  },
]

export const JUDGE_INFO = {
  name: "Dr. Felipe Bertrand Sardenberg Moulin",
  role: "Juiz de Direito Titular",
  bio: "Graduado em Direito pela FDV, especialista em Processo Civil, Digital Hacking e IA aplicada ao Direito. Atua na magistratura capixaba há mais de 20 anos, com foco em celeridade e gestão processual por meio do uso de ferramentas de Inteligência Artificial e humanização da Justiça.",
  imageUrl:
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
}

export const CONTACT_INFO = {
  address: "R. Meridional, 1000 - Alto Lage, Cariacica - ES, 29151-230",
  email: "2acivelcariacica@gmail.com",
  phone: "(27) 3246-5641",
}

export const FALLBACK_NEWS = [
  {
    id: "1",
    title: "TJES publica novo edital de Leilão Eletrônico Unificado",
    date: "Atualizado",
    summary:
      "Bens penhorados vão a leilão eletrônico conforme determinação do tribunal.",
    category: "Editais",
  },
  {
    id: "2",
    title:
      "PJe: Sistema passará por manutenção programada neste fim de semana",
    date: "Aviso",
    summary:
      "Indisponibilidade prevista para atualização de segurança e novas funcionalidades.",
    category: "Tecnologia",
  },
  {
    id: "3",
    title:
      "Corregedoria Geral da Justiça divulga calendário de correições",
    date: "Institucional",
    summary:
      "Confira as datas das correições ordinárias nas comarcas do estado.",
    category: "Corregedoria",
  },
]
