# Portal da 2ª Vara Cível de Cariacica

Portal de informações, contato com a equipe, artigos e notícias. O guia de atendimento apresenta orientações previamente definidas: não registra demandas, não reserva horários e não chama modelos de IA.

## Requisitos

- Node.js 24.x (compatível com a configuração consultada da Vercel).
- Funções da Vercel na região `gru1` (São Paulo), definida em `vercel.json`: o feed de notícias do TJES responde 403 a acessos da região padrão (`iad1`, EUA), e o Supabase de produção fica em `sa-east-1`.
- Bun 1.4.3, fixado em `packageManager`.
- Next.js 16.4.6, React/React DOM 19.3.1.

```bash
bun install --frozen-lockfile
cp .env.example .env.local
# Configure o Supabase, o banco, os administradores e as proteções de produção.
bun run dev
```

## Configuração e acesso administrativo

`ADMIN_USER_IDS` é uma lista de UUIDs das contas administrativas existentes no Supabase, separados por vírgulas. É uma variável exclusiva do servidor. Não use e-mails, `user_metadata` ou variáveis `NEXT_PUBLIC_` para conceder permissão. Lista ausente, vazia ou inválida nega o acesso. Somente atribua UUIDs cuja identidade e autorização tenham sido verificadas.

As ações administrativas, o layout, o Proxy e o upload verificam a autorização. Os campos de auditoria (`answeredBy`, `confirmedBy`, `resolvedBy`) gravam o e-mail da conta autenticada, nunca um valor enviado pelo navegador. As APIs diferenciam ausência de sessão (401), usuário sem permissão (403) e dependência/configuração indisponível (503). As páginas usam login ou telas de acesso negado/indisponibilidade. `proxy.ts` preserva os cookies renovados; sua proteção não substitui a guarda em cada operação.

As rotas do painel ficam em `app/(admin)` (`/admin`, `/login`, `/acesso-negado`, `/servico-indisponivel`) e não carregam VLibras, guia nem barra de acessibilidade, que ficam em `app/(public)`. Nelas, `proxy.ts` envia uma CSP com nonce novo a cada pedido, sem `'unsafe-inline'` (e sem `'unsafe-eval'` fora do `next dev`); por isso são renderizadas sob demanda. A CSP das páginas públicas, que o VLibras exige, vem de `next.config.ts` e não alcança essas rotas. A sessão do painel dura 8 horas a partir do login (`ADMIN_SESSION_MAX_AGE_SECONDS`); depois disso a pessoa entra de novo.

`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` são obrigatórios em produção. A falta da proteção ou sua indisponibilidade resulta em 503 nas rotas públicas protegidas; esgotamento da cota resulta em 429. Em desenvolvimento e nos testes locais, a proteção pode ser omitida.

`RESEND_API_KEY` habilita notificações. Contatos são confirmados após persistência; a notificação ocorre depois da resposta com `after()`. Falhas são sinalizadas por evento e ID, sem copiar a mensagem aos logs. Não há fila durável de retentativas neste lote.

## Fluxos públicos

- `POST /api/contact`: valida entrada, persiste em `contact_messages` e retorna 201 com `message` e `id`. Esse identificador é de contato, não protocolo de petição ou confirmação de agendamento. O assunto precisa ser um dos valores do formulário (`CONTACT_SUBJECTS` em `lib/constants.ts`); o campo oculto `website` (honeypot) preenchido resulta em 400, sem gravar.
- `POST /api/client-errors`: recebe os erros do navegador (`lib/logger.ts`), com corpo de até 8192 bytes e o mesmo rate limit obrigatório das outras rotas públicas (503 sem a proteção em produção, 429 na cota). Registra só as chaves conhecidas e o caminho das URLs, sem consulta nem domínio.
- `POST /api/chat`: recebe `{ "option": "services" | "contact" | "virtual" }` e retorna orientação JSON. Clientes antigos com `message/history` recebem orientação fixa em SSE, sem reflexão do conteúdo e sem chamada a provedor.
- `/api/appointments` e `/api/demands` foram desativadas: respondem 410 a qualquer método, sem gravar e sem enviar e-mail. As tabelas `appointments` e `demands` e as telas do painel que listam os registros antigos continuam disponíveis.
- `/api/news?cron=true`: exige `Authorization: Bearer <CRON_SECRET>` (comparação em tempo constante; sem a variável, 503). Lê o RSS do TJES diretamente, com `User-Agent` identificável, guarda só links `https` de `tjes.jus.br`, registra no log um JSON `news_scrape` (`fetched`, `inserted`, `updated`, `skipped`, `errors`) e revalida `/` e `/noticias` quando há novidade. Feed recusado ou sem itens responde 502; falha de banco, 500.
- `GET /api/news?limit=n`: `n` inteiro de 1 a 50; valor ausente ou inválido usa 10.

## Páginas públicas, busca e métricas

- `/noticias` (SPEC-PORTAL-001 R3.5): 30 notícias por página, navegação por links (`/noticias?pagina=N`; valor inválido vira a página 1; página além do fim explica e leva à primeira). Só itens ativos dos últimos 90 dias (`lib/news.ts`, relógio do banco; sem data de publicação, vale a data da coleta). Os antigos continuam na tabela e no painel. Todas as categorias são exibidas (Q-5). A prévia da home segue a mesma regra. A página é renderizada a cada pedido, por causa do parâmetro.
- Busca (R3.1): `metadataBase` `https://2avaraciveldecariacica.org`, títulos "<página> | 2ª Vara Cível de Cariacica", canonical e Open Graph por página (`lib/seo.ts:pageMetadata`), imagem `public/images/og-portal.jpg` (1200×630). JSON-LD `GovernmentOrganization` (endereço, telefone e horário de `lib/constants.ts`) e `FAQPage` na home, `Article` em cada artigo. `sitemap.xml` com `/`, `/pauta`, `/noticias`, `/artigos` e os artigos publicados (revalidado a cada hora); `robots.txt` exclui as rotas do grupo admin e `/api/`. Os textos não apresentam o portal como página oficial do TJES.
- Perguntas frequentes (R3.2) em `<details>/<summary>`, com as respostas no HTML do servidor.
- Erros (R3.4): `error.tsx` nos grupos público e admin e no painel, `global-error.tsx`, `not-found.tsx` (raiz, público e painel) e `loading.tsx` (`/noticias` e painel), em português. Endereços desconhecidos respondem 404.
- Peso (R3.3): sem framer-motion (revelação ao rolar em CSS, `components/motion`), assunto do contato em `<select>` nativo, foto do Fórum sem `priority` e Geist Mono só no painel.
- Métricas (R3.8): Vercel Web Analytics (`@vercel/analytics`, sem cookies) só no layout público, e só em builds da Vercel (`VERCEL=1`). Script e envio são da mesma origem (`/_vercel/insights/*`), já permitidos pela CSP pública. Eventos, sem dados pessoais (`lib/analytics.ts`): `zoom_tutorial_play` (primeira reprodução do vídeo do Zoom no card "Audiências Virtuais") e `contact_form_sent` (contato confirmado com 201; só o assunto). `trackHomeShortcut` está pronta para os quatro atalhos da primeira tela (T029). Para coletar, é preciso ativar Web Analytics no projeto da Vercel (passo manual).

## Retenção de dados pessoais

Contatos (`contact_messages`), agendamentos (`appointments`) e demandas (`demands`) são guardados por **12 meses** a partir de `created_at` e depois excluídos (`RETENTION_MONTHS` em `lib/retention.ts`; SPEC-PORTAL-001, R3.6). A exclusão é definitiva e corre numa transação: as três tabelas são expurgadas juntas ou nenhuma é. O corte é calculado pelo relógio do banco (`now() - interval '12 months'`). Notícias e artigos não entram na rotina.

- `GET /api/retention`: chamado pelo cron diário da Vercel às 06:30 UTC (`30 6 * * *` em `vercel.json`, horário diferente do cron de notícias). Mesma autenticação do cron de notícias (`lib/cron-auth.ts`): `Authorization: Bearer <CRON_SECRET>` comparado em tempo constante; sem a variável, 503; segredo errado, 401.
- Sucesso: 200 com `{ retentionMonths, deleted: { contactMessages, appointments, demands } }` e log JSON `data_retention` só com as contagens, sem dados pessoais.
- Falha de banco: 500 com `{ error: <nome do erro> }`; o log registra só o nome, sem SQL nem parâmetros.

O formulário de contato mostra, acima do botão Enviar, o aviso: "Seus dados servem só para responder a esta mensagem. Dúvidas sobre proteção de dados: suporte@lexintelligentia.com.br." O portal não publica política de privacidade nem termos de uso, porque não é página oficial do TJES (decisão do responsável de 20/11/2026).

## Validação reproduzível

```bash
bun run audit:production
bun run lint
bun run typecheck
bun test tests
bun x playwright install --with-deps chromium
bun run verify:local
```

`verify:local` cria PostgreSQL descartável em memória com PGlite, gera o esquema a partir do Drizzle, insere conteúdo fictício (um artigo, 35 notícias recentes e uma de 100 dias), executa o build de produção e a suíte Playwright. Sobrescreve `DATABASE_URL` e credenciais dos serviços: não usa o banco fornecido pelo ambiente, não envia e-mails e não chama IA. Para apenas o build: `bun scripts/verify-local.ts build`. Para apenas E2E: `bun run test:e2e`.

PGlite valida SQL, persistência e renderização, mas não reproduz as políticas RLS/Storage/Auth do Supabase. Os testes de autorização de funções/rotas usam identidades simuladas. Antes de publicar, é necessária validação em homologação com as configurações reais de acesso.

Opcionalmente, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` informa um Chromium já instalado no ambiente de teste. O padrão usa o navegador instalado pelo Playwright.

O workflow `.github/workflows/ci.yml` executa as verificações com Node 24 e Bun 1.4.3, sem segredos de produção.

`bun run audit:production` consulta os avisos do lockfile e bloqueia os que atingem o grafo de dependências de produção. O total de avisos do lockfile, inclusive ferramentas de desenvolvimento, continua visível; este comando não declara o conjunto completo livre de vulnerabilidades.

## Publicação

Veja [docs/STABILIZATION.md](docs/STABILIZATION.md) para os requisitos, evidências e pendências. Esta branch não deve ser promovida sem configurar os UUIDs autorizados, verificar a proteção de volume e revisar permissões das tabelas e do bucket de imagens. A configuração do host Supabase restringe imagens ao projeto informado e ao bucket público `images`.

## Licença

Copyright 2026 2ª Vara Cível de Cariacica. Desenvolvido e publicado por Felipe Moulin (Instagram: @felipemoulinjus).
