# Portal da 2ª Vara Cível de Cariacica

Portal de informações, contato com a equipe, artigos e notícias. O guia de atendimento apresenta orientações previamente definidas: não registra demandas, não reserva horários e não chama modelos de IA.

## Requisitos

- Node.js 24.x (compatível com a configuração consultada da Vercel).
- Bun 1.4.3, fixado em `packageManager`.
- Next.js 16.4.2, React/React DOM 19.3.1.

```bash
bun install --frozen-lockfile
cp .env.example .env.local
# Configure o Supabase, o banco, os administradores e as proteções de produção.
bun run dev
```

## Configuração e acesso administrativo

`ADMIN_USER_IDS` é uma lista de UUIDs das contas administrativas existentes no Supabase, separados por vírgulas. É uma variável exclusiva do servidor. Não use e-mails, `user_metadata` ou variáveis `NEXT_PUBLIC_` para conceder permissão. Lista ausente, vazia ou inválida nega o acesso. Somente atribua UUIDs cuja identidade e autorização tenham sido verificadas.

As ações administrativas, o layout, o Proxy e o upload verificam a autorização. As APIs diferenciam ausência de sessão (401), usuário sem permissão (403) e dependência/configuração indisponível (503). As páginas usam login ou telas de acesso negado/indisponibilidade. `proxy.ts` preserva os cookies renovados; sua proteção não substitui a guarda em cada operação.

`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` são obrigatórios em produção. A falta da proteção ou sua indisponibilidade resulta em 503 nas rotas públicas protegidas; esgotamento da cota resulta em 429. Em desenvolvimento e nos testes locais, a proteção pode ser omitida.

`RESEND_API_KEY` habilita notificações. Contatos são confirmados após persistência; a notificação ocorre depois da resposta com `after()`. Falhas são sinalizadas por evento e ID, sem copiar a mensagem aos logs. Não há fila durável de retentativas neste lote.

## Fluxos públicos

- `POST /api/contact`: valida entrada, persiste em `contact_messages` e retorna 201 com `message` e `id`. Esse identificador é de contato, não protocolo de petição ou confirmação de agendamento.
- `POST /api/chat`: recebe `{ "option": "services" | "contact" | "virtual" }` e retorna orientação JSON. Clientes antigos com `message/history` recebem orientação fixa em SSE, sem reflexão do conteúdo e sem chamada a provedor.
- `/api/appointments` e `/api/demands` mantêm seus contratos existentes; o guia não chama essas rotas.
- `/api/news?cron=true`: mantém a autenticação por `CRON_SECRET`.

## Validação reproduzível

```bash
bun run audit:production
bun run lint
bun run typecheck
bun test tests
bun x playwright install --with-deps chromium
bun run verify:local
```

`verify:local` cria PostgreSQL descartável em memória com PGlite, gera o esquema a partir do Drizzle, insere conteúdo fictício, executa o build de produção e a suíte Playwright. Sobrescreve `DATABASE_URL` e credenciais dos serviços: não usa o banco fornecido pelo ambiente, não envia e-mails e não chama IA. Para apenas o build: `bun scripts/verify-local.ts build`. Para apenas E2E: `bun run test:e2e`.

PGlite valida SQL, persistência e renderização, mas não reproduz as políticas RLS/Storage/Auth do Supabase. Os testes de autorização de funções/rotas usam identidades simuladas. Antes de publicar, é necessária validação em homologação com as configurações reais de acesso.

Opcionalmente, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` informa um Chromium já instalado no ambiente de teste. O padrão usa o navegador instalado pelo Playwright.

O workflow `.github/workflows/ci.yml` executa as verificações com Node 24 e Bun 1.4.3, sem segredos de produção.

`bun run audit:production` consulta os avisos do lockfile e bloqueia os que atingem o grafo de dependências de produção. O total de avisos do lockfile, inclusive ferramentas de desenvolvimento, continua visível; este comando não declara o conjunto completo livre de vulnerabilidades.

## Publicação

Veja [docs/STABILIZATION.md](docs/STABILIZATION.md) para os requisitos, evidências e pendências. Esta branch não deve ser promovida sem configurar os UUIDs autorizados, verificar a proteção de volume e revisar permissões das tabelas e do bucket de imagens. A configuração do host Supabase restringe imagens ao projeto informado e ao bucket público `images`.

## Licença

Copyright 2026 2ª Vara Cível de Cariacica. Desenvolvido por Lex Intelligentia.
