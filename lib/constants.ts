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
    description: "Acesse o andamento atualizado dos seus processos judiciais.",
    icon: "search",
    url: "https://portaldeservicos.pdpj.jus.br/consulta",
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
      { label: "Preencher Formulário", url: "/#contato", icon: "file-text" },
      { label: "Orientações de atendimento", url: "#assistant-panel", icon: "message-square" },
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
    question: "Como entro em contato com a Assessoria do Gabinete ou com o Juiz?",
    answer:
      "O atendimento com a Assessoria do Gabinete da 2ª Vara Cível ou com o Juiz Titular pode ser previamente agendado por meio de um dos canais disponíveis nesta página: preenchendo o formulário de contato ou enviando um e-mail à equipe. O guia deste site apenas orienta sobre esses canais e não reserva horários.",
  },
  {
    id: "5",
    category: "Solicitações",
    question: "Como faço para registrar minha demanda ou fazer uma solicitação?",
    answer:
      "Você pode registrar sua demanda ou fazer uma solicitação por meio de um dos canais disponíveis nesta página: preenchendo o formulário de contato, enviando um e-mail para a secretaria ou utilizando o telefone da equipe. O guia deste site não registra solicitações. Nossa equipe analisará sua solicitação e entrará em contato o mais breve possível.",
  },
]

export const JUDGE_INFO = {
  name: "Dr. Felipe Bertrand Sardenberg Moulin",
  role: "Juiz de Direito Titular",
  bio: "Graduado em Direito pela FDV, especialista em Processo Civil, Digital Hacking e IA aplicada ao Direito. Atua na magistratura capixaba há mais de 20 anos, com foco em celeridade e gestão processual por meio do uso de ferramentas de Inteligência Artificial e humanização da Justiça.",
}

export const CONTACT_INFO = {
  address: "R. Meridional, 1000 - Alto Lage, Cariacica - ES, 29151-230",
  email: "2acivelcariacica@gmail.com",
  phone: "(27) 3246-5641",
}

export const TJES_NEWS_URL = "https://www.tjes.jus.br/category/s1-front-page/ultimasnoticias/"
