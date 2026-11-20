import type { Metadata } from "next"
import Link from "next/link"
import { ApprovalNotice, Pending } from "@/components/legal/approval"

export const metadata: Metadata = {
  title: "Termos de Uso — 2ª Vara Cível de Cariacica",
  description:
    "Regras de uso do portal informativo da 2ª Vara Cível de Cariacica e os limites do formulário de contato.",
}

const linkClass = "underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"

export default function TermsOfUsePage() {
  return (
    <section id="main-content" className="mx-auto max-w-3xl space-y-8 px-4 py-12 leading-relaxed">
      <Link href="/" className="underline">
        Voltar ao início
      </Link>
      <ApprovalNotice />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Termos de Uso</h1>
        <p className="text-sm">
          Atualizados em <time dateTime="2026-11-20">20 de novembro de 2026</time>.
        </p>
      </header>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">O que é este portal</h2>
        <p>
          Este portal é informativo. Ele é mantido pela própria 2ª Vara Cível de Cariacica, no
          endereço 2avaraciveldecariacica.org.
        </p>
        <p>
          Ele não é o site oficial do Tribunal de Justiça do Espírito Santo (TJES). O site oficial é{" "}
          <a href="https://www.tjes.jus.br" className={linkClass}>
            www.tjes.jus.br
          </a>
          .
        </p>
        <p>Ao usar o portal, você concorda com estes termos.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">O portal não substitui as comunicações oficiais</h2>
        <p>
          As informações do portal ajudam você a se orientar. Elas não substituem intimações, prazos
          e comunicações oficiais.
        </p>
        <p>
          Os atos oficiais do processo ficam no Processo Judicial Eletrônico (PJe) e no Diário da
          Justiça Eletrônico (DJe). Confira sempre essas fontes, principalmente antes de contar um
          prazo.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">O formulário de contato não protocola petições</h2>
        <p>
          O formulário serve para tirar dúvidas e pedir orientação. Ele não protocola petições, não
          junta documentos ao processo e não suspende prazos.
        </p>
        <p>Para peticionar, use o PJe.</p>
        <p>
          O envio do formulário também não confirma data ou horário de atendimento. A equipe
          responde pelos contatos que você informar.
        </p>
        <p>
          O guia de atendimento do portal funciona com respostas prontas. Ele não usa inteligência
          artificial, não registra demandas e não reserva horários.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Uso aceitável</h2>
        <p>Ao usar o portal, você se compromete a:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>enviar informações verdadeiras;</li>
          <li>não enviar conteúdo ofensivo, ameaçador ou ilegal;</li>
          <li>não enviar dados sensíveis nem documentos de processos em segredo de justiça;</li>
          <li>não enviar dados de outras pessoas sem necessidade;</li>
          <li>não fazer envios repetidos ou automáticos para sobrecarregar o portal;</li>
          <li>não tentar burlar a segurança ou acessar áreas restritas.</li>
        </ul>
        <p>O portal limita o número de envios para conter abusos.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Links para outros sites</h2>
        <p>O portal indica serviços de outras instituições e empresas, como:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            o site e o Balcão Virtual do{" "}
            <a href="https://www.tjes.jus.br" className={linkClass}>
              TJES
            </a>
            ;
          </li>
          <li>
            a consulta processual da{" "}
            <a href="https://portaldeservicos.pdpj.jus.br/consulta" className={linkClass}>
              Plataforma Digital do Poder Judiciário (PDPJ)
            </a>
            ;
          </li>
          <li>o aplicativo Zoom, usado nas audiências virtuais e híbridas.</li>
        </ul>
        <p>
          Esses sites têm regras e políticas de privacidade próprias. A vara não controla o conteúdo
          nem o funcionamento deles.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Conteúdo do portal</h2>
        <p>
          <Pending kind="proposta" /> Os textos e vídeos institucionais do portal podem ser
          reproduzidos para fins informativos, com indicação da fonte.
        </p>
        <p>Marcas, notícias e conteúdos de terceiros pertencem aos seus titulares.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Privacidade</h2>
        <p>
          Saiba como usamos os dados do formulário na{" "}
          <Link href="/privacidade" className={linkClass}>
            Política de Privacidade
          </Link>
          .
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Mudanças nestes termos</h2>
        <p>Podemos atualizar estes termos. A data no início da página mostra a versão em vigor.</p>
      </div>
    </section>
  )
}
