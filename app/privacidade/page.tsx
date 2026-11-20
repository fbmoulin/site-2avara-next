import type { Metadata } from "next"
import Link from "next/link"
import { ApprovalNotice, Pending } from "@/components/legal/approval"
import { CONTACT_INFO } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Política de Privacidade — 2ª Vara Cível de Cariacica",
  description:
    "Como o portal da 2ª Vara Cível de Cariacica usa e protege os dados enviados pelo formulário de contato.",
}

const linkClass = "underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-300"

export default function PrivacyPolicyPage() {
  return (
    <section id="main-content" className="mx-auto max-w-3xl space-y-8 px-4 py-12 leading-relaxed">
      <Link href="/" className="underline">
        Voltar ao início
      </Link>
      <ApprovalNotice />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-sm">
          Atualizada em <time dateTime="2026-11-20">20 de novembro de 2026</time>.
        </p>
      </header>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Sobre este portal</h2>
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
        <p>
          Esta política explica quais dados recebemos, para que servem e como você pode exercer seus
          direitos.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Quais dados recebemos</h2>
        <p>Pelo formulário de contato, você nos envia:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>nome completo;</li>
          <li>telefone;</li>
          <li>e-mail;</li>
          <li>assunto;</li>
          <li>mensagem.</li>
        </ul>
        <p>
          Não envie dados sensíveis, como informações de saúde, religião ou origem racial. Não envie
          documentos nem detalhes de processos em segredo de justiça.
        </p>
        <p>
          Para conter abusos, o portal usa o endereço IP do seu acesso por pouco tempo, só para
          limitar o número de envios. Esse controle usa o serviço Upstash Redis.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Para que usamos seus dados</h2>
        <p>Usamos os dados do formulário só para:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>responder à sua solicitação;</li>
          <li>orientar você sobre o atendimento da vara.</li>
        </ul>
        <p>O envio do formulário não protocola petições nem confirma data ou horário.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Guia de atendimento</h2>
        <p>
          O guia de atendimento do portal funciona com respostas prontas. Ele não usa inteligência
          artificial, não registra demandas e não coleta dados de processos.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Base legal</h2>
        <p>
          <Pending kind="proposta" /> Tratamos os dados com base na Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018, LGPD), art. 7º, inciso III, e art. 23. Essas regras permitem que o
          poder público trate dados para cumprir suas atribuições legais e atender o cidadão.
        </p>
        <p>Quando couber, também se aplica a Lei de Acesso à Informação (Lei nº 12.527/2011).</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Onde os dados ficam e quem os recebe</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            A mensagem é gravada no banco de dados do portal, no serviço Supabase, em servidores na
            região de São Paulo (sa-east-1).
          </li>
          <li>O portal é hospedado no serviço Vercel.</li>
          <li>
            Um aviso com a mensagem é enviado por e-mail pelo serviço Resend. Ele chega à caixa do
            gabinete ({CONTACT_INFO.email}), operada pela equipe do gabinete. O juiz titular recebe
            uma cópia oculta no e-mail funcional dele.{" "}
            <Pending kind="a confirmar">
              manutenção da caixa do Gmail como canal do gabinete
            </Pending>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Por quanto tempo guardamos</h2>
        <p>
          <Pending kind="proposta" /> Guardamos as mensagens por 12 meses, contados do registro.
          Depois desse prazo, os dados são anonimizados ou excluídos.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Como protegemos os dados</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Só o servidor do portal acessa o banco de dados. O acesso público é bloqueado.</li>
          <li>O painel de gestão é restrito a contas autorizadas da equipe.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Cookies e armazenamento no navegador</h2>
        <p>O portal não usa cookies de rastreamento nem ferramentas de análise de visitas.</p>
        <p>
          A barra de acessibilidade guarda suas preferências de fonte, contraste e modo escuro só no
          seu navegador (armazenamento local). Esses dados não são enviados ao portal. Você pode
          apagá-los limpando os dados do site no navegador.
        </p>
        <p>O painel da equipe usa cookies de sessão apenas para o login das contas autorizadas.</p>
        <p>
          Algumas páginas exibem conteúdo de outros serviços, como o mapa do Google na página
          inicial e o tradutor de Libras VLibras, do Governo Federal. Esses serviços seguem as
          próprias políticas de privacidade.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Quem é o controlador dos dados</h2>
        <p>
          <Pending kind="proposta" /> O controlador é o Tribunal de Justiça do Estado do Espírito
          Santo (TJES). Você pode procurar o encarregado de dados do TJES:{" "}
          <Pending kind="a confirmar">canal do encarregado do TJES</Pending>.
        </p>
        <p>A 2ª Vara Cível de Cariacica é o canal de contato direto sobre este portal.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Seus direitos</h2>
        <p>A LGPD (art. 18) garante a você o direito de:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>saber se tratamos seus dados;</li>
          <li>acessar seus dados;</li>
          <li>corrigir dados incompletos, errados ou desatualizados;</li>
          <li>
            pedir a anonimização, o bloqueio ou a exclusão de dados desnecessários ou excessivos;
          </li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Como exercer seus direitos</h2>
        <p>Fale com a 2ª Vara Cível de Cariacica:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            e-mail:{" "}
            <a href={`mailto:${CONTACT_INFO.email}`} className={linkClass}>
              {CONTACT_INFO.email}
            </a>
            ;
          </li>
          <li>telefone: {CONTACT_INFO.phone};</li>
          <li>endereço: {CONTACT_INFO.address}.</li>
        </ul>
        <p>Informe seu nome e o que deseja fazer com seus dados.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Mudanças nesta política</h2>
        <p>
          Podemos atualizar esta política. A data no início da página mostra a versão em vigor. Veja
          também os{" "}
          <Link href="/termos" className={linkClass}>
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
