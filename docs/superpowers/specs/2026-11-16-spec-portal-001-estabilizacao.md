# SPEC-PORTAL-001 — Estabilização, segurança e experiência do portal

**Projeto:** site-2avara-next (portal público da 2ª Vara Cível de Cariacica)
**Data:** 16/11/2026
**Status:** Rascunho para aprovação
**Versão de referência:** produção em 2avaraciveldecariacica.org = commit `ab56f13` (`master`), deploy `dpl_ELgUp6MFmWJJLKtdwxKAyDRLEKAG`, conferido em 16/11/2026
**Origem:** documento "Revisão do portal da 2ª Vara Cível de Cariacica — segurança, UX e otimização" (16/11/2026); plano de execução em três ondas aprovado em 16/11/2026

## 1. Contexto

O portal está no ar com o commit `ab56f13`. A revisão de 16/11/2026 encontrou falhas visíveis ao público e riscos de dados pessoais. As causas abaixo foram confirmadas em 16/11/2026.

| Sintoma | Causa confirmada |
| --- | --- |
| `/pauta` mostra "Não foi possível consultar a pauta" | As migrações `20261024_hearing_schedules.sql` e `20261024_staff_and_drafts.sql` só foram aplicadas no Supabase de preview (`docs/PAUTA-E-USUARIOS.md`). A tabela não existe no banco de produção. |
| Painel `/admin` inacessível em produção | `ADMIN_USER_IDS` só existe no ambiente Preview da Vercel. Sem a variável, `authorizeAdmin` responde 503 e `authorizeStaff` não encontra `staff_users`. |
| Notícias paradas em 20/10/2026 | O feed RSS do TJES está ativo (itens de 13/11/2026), mas recusa requisições automatizadas. O coletor falha nos dois caminhos e não registra erro. A home é estática e nunca é revalidada. |
| Risco de exposição de dados pessoais | Nenhuma migração ativa RLS em `contact_messages`, `appointments`, `demands`, `articles` e `news`. A anon key é pública. Confirmado e corrigido em 20/11/2026 (§9). |
| Rodapé abaixo do contraste mínimo | "Política de Privacidade" e "Termos de Uso" a 4,23:1; "Desenvolvido por" a 2,66:1 (mínimo 4,5:1). |
| Mapa aponta para outro lugar | O embed marca −20,3508 / −40,4106; o Fórum fica em −20,3332 / −40,3767 (cerca de 4 km). |

## 2. Objetivos

| ID | Resultado esperado | Como medir |
| --- | --- | --- |
| O1 | Pauta e painel funcionando em produção | `/pauta` sem `read_failed` no log; responsável entra em `/admin` |
| O2 | Notícias do TJES atualizadas todo dia útil | Item mais recente em `/` com no máximo 24 h de atraso em relação ao feed |
| O3 | Nenhum dado pessoal legível com a anon key; LGPD básica atendida | Consulta REST anônima às cinco tabelas retorna erro de permissão; aviso de uso dos dados no formulário; expurgo após 12 meses (R1.7 e R3.6, alterados em 20/11/2026) |
| O4 | Navegação e formulários utilizáveis por teclado, leitor de tela e celular | Casos E2E novos aprovados; nenhuma falha WCAG 2.1 AA nos fluxos principais |
| O5 | Linha de base de uso das tarefas principais | Eventos dos quatro atalhos registrados por quatro semanas |

**Fora do escopo:** redesenho visual completo, troca de stack, guia com IA, integração com o PJe, novo domínio.

## 3. Invariantes (não podem regredir)

Tirados de `CLAUDE.md`, `AGENTS.md` e da revisão:

1. Bun é o único gerenciador de pacotes e scripts.
2. Contato: gravar antes de responder 201; notificar depois da resposta; falha de e-mail não vira falha de gravação; nenhum dado pessoal em log.
3. Rate limit obrigatório em produção: dependência ausente ou com erro = 503; cota esgotada = 429.
4. O guia de atendimento continua determinístico, sem modelos e sem coletar casos.
5. Autorização fail-closed: sem identidade = 401; sem permissão = 403; configuração ausente = 503. Nunca autorizar por padrão.
6. Testes nunca usam produção como fixture. Mudança de esquema em produção só por migração versionada, com cópia de segurança antes.
7. Interface em português; componentes de servidor por padrão; nomes de código em inglês.
8. Ler `node_modules/next/dist/docs/` antes de usar API do Next 16.

## 4. Requisitos

Cada requisito tem critério de aceite verificável. A prioridade segue a revisão (P0 a P3).

### Onda 1 — produção operacional e riscos imediatos

**R1.1 (P0) Banco de produção alinhado e protegido**
- Aplicar em produção, nesta ordem: `20261024_hearing_schedules.sql`, `20261024_staff_and_drafts.sql` e a nova `20261116_rls_public_tables.sql`.
- A nova migração ativa RLS e revoga `anon`/`authenticated` em `contact_messages`, `appointments`, `demands`, `articles` e `news`, e inclui o script de reversão.
- No Supabase Auth de produção, cadastro público desativado.
- Aceite: `relrowsecurity = true` nas sete tabelas; `GET /rest/v1/<tabela>?select=id&limit=0` com a anon key retorna erro de permissão nas cinco tabelas; `/pauta` mostra "ainda não foi publicada" ou a tabela; nenhum `read_failed` no log após o deploy.

**R1.2 (P1) Responsável e equipe em produção**
- `ADMIN_USER_IDS` em Production com o UUID do responsável (conta Supabase de produção).
- Cadastrar assessoras e estagiárias em `/admin/usuarios`.
- Aceite: responsável abre `/admin/usuarios`; conta de estagiária abre `/admin/pauta` e recebe 403 em `/admin/contatos`.

**R1.3 (P1) Coletor de notícias confiável**
- Requisição com `User-Agent` identificável e `Accept: application/rss+xml`.
- Remover o caminho por `r.jina.ai`.
- Aceitar só links `https:` com host terminando em `tjes.jus.br`.
- Registrar no log o resultado (`inserted`, `updated`, `errors`), sem dados pessoais.
- Ao final, chamar `revalidatePath("/")` e `revalidatePath("/noticias")`.
- Comparar `CRON_SECRET` em tempo constante.
- Aceite: execução do cron em produção grava os itens recentes do feed; a home mostra o item mais recente em até 1 h. Se o TJES continuar recusando os IPs da Vercel, aplicar a alternativa decidida em Q-4.

**R1.4 (P1) Home revalidada**
- `export const revalidate = 3600` em `app/page.tsx`.
- Aceite: cabeçalho `age` da home nunca passa de 3600 s após a primeira revalidação.

**R1.5 (P1) Rotas sem uso removidas**
- `/api/appointments` e `/api/demands` respondem 410 e não enviam e-mail.
- Aceite: teste unitário e E2E confirmam 410 e nenhuma chamada a `sendEmail`.

**R1.6 (P2) Cabeçalhos e segredos**
- CSP sem `api.openai.com`, com host Supabase fixo e com `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Remover `OPENAI_API_KEY` da Vercel.
- Recriar `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` de Production como "Sensitive" (a Vercel aponta `readable-secret`).
- Aceite: cabeçalhos conferidos na resposta de produção; VLibras continua funcionando; a Vercel não aponta mais `readable-secret`.

**R1.7 (P1) Aviso de uso dos dados** — alterado em 20/11/2026 por decisão do responsável (D-5)
- Sem páginas `/privacidade` e `/termos`: o portal não é página oficial do TJES.
- Os itens "Política de Privacidade" e "Termos de Uso" (texto sem link) saem do rodapé, com o bloco "Institucional".
- Aviso de uma linha acima do botão Enviar, sem link para política e sem checkbox: "Seus dados servem só para responder a esta mensagem. Dúvidas sobre proteção de dados: suporte@lexintelligentia.com.br." O e-mail é `mailto:`; o aviso descreve o botão por `aria-describedby`.
- Contraste mínimo de 4,5:1 no aviso e no crédito do rodapé.
- Aceite: E2E confere ausência dos itens no rodapé, texto do aviso, descrição acessível do botão e contraste medido no navegador.
- Texto original (substituído): páginas `/privacidade` e `/termos` com links no rodapé; aviso com link para `/privacidade`; política com finalidade, base legal, dados, retenção (Q-1), compartilhamento, direitos do titular e canal (Q-7).

**R1.8 (P3) Domínio**
- `www.2avaraciveldecariacica.org` redireciona com 308 para o domínio principal.
- Registro A na Hostinger nos IPs recomendados pela Vercel.
- Aceite: `curl -I https://www.2avaraciveldecariacica.org/` retorna 308; a Vercel não marca mais `optional-change`.

### Onda 2 — estrutura e acessibilidade

**R2.1 (P1) Admin isolado**
- Grupos de rotas `app/(public)` (VLibras, guia, barra de acessibilidade) e `app/(admin)` (sem scripts externos).
- CSP com nonce via `proxy.ts` no admin.
- Sessão Supabase mais curta (Q-8).
- Aceite: HTML do `/admin` sem `vlibras.gov.br`; CSP do admin sem `unsafe-inline`/`unsafe-eval` em `script-src`.

**R2.2 (P1) Navegação**
- Itens do menu como `<Link href="/#secao">`, com links para Notícias, Artigos e Pauta.
- Seções com `scroll-margin-top`.
- Menu móvel fecha com Esc, ao clicar fora e ao navegar; fundo opaco; rolagem travada; foco preso e devolvido ao botão.
- Aceite: E2E navega pelo menu a partir de `/noticias`, `/artigos` e `/pauta`; E2E móvel fecha o menu com Esc.

**R2.3 (P1) Conteúdo visível sem JavaScript**
- Hero sem `ScrollReveal`; nenhum bloco acima da dobra com `opacity:0` no HTML do servidor.
- `<MotionConfig reducedMotion="user">` no layout público.
- Aceite: HTML de `/` sem `opacity:0` no hero; E2E com `toHaveCSS("opacity","1")`; com `prefers-reduced-motion`, nenhuma transição.

**R2.4 (P1) Cards de serviços**
- Conteúdo recolhido não renderizado ou `inert`.
- `aria-expanded` e `aria-controls` no botão; cards sem conteúdo expansível não usam `<button>`.
- Aceite: Tab não alcança links ocultos; axe sem violações nos cards.

**R2.5 (P2) Landmarks**
- Um único `<main id="main-content" tabIndex={-1}>` no layout; `<div>` nas páginas.
- Aceite: um `main` por página; o link de salto funciona em todas as rotas públicas.

**R2.6 (P2) Login**
- Redirecionamento só para a mesma origem e caminho iniciado em `/admin`.
- Aceite: `/login?redirect=/\evil.com` termina em `/admin`.

**R2.7 (P2) Entradas do servidor**
- Assunto do contato como `z.enum` igual à lista da tela.
- Campo honeypot.
- `/api/client-errors` com `readJsonBody(req, 8192)`, rate limit, chaves permitidas e só o `pathname` no log.
- Auditoria grava o e-mail de `requireAdmin()`.
- `zoomLink` validado como URL `https` do Zoom; `notes` com no máximo 5000 caracteres.
- `/api/news?limit` validado com zod.
- Aceite: testes unitários para cada validação.

**R2.8 (P2) Formulário de contato**
- `autocomplete` (`name`, `tel`, `email`).
- Erros ligados aos campos com `aria-invalid`/`aria-describedby`; dica de formato visível.
- Foco na mensagem de sucesso.
- Telefone e e-mail do gabinete como `tel:` e `mailto:`.
- Aceite: E2E de envio com teclado; leitor de tela anuncia erro e sucesso.

**R2.9 (P2) Rodapé, mapa e pauta**
- Textos do rodapé com contraste ≥ 4,5:1.
- `h2` oculto acima dos `h3` do rodapé.
- Embed do mapa centrado no Fórum (−20,3332 / −40,3767).
- Mensagem de erro da pauta com Balcão Virtual e telefone.
- Aceite: medição de contraste; marcador sobre o Fórum.

**R2.10 (P1) Artigos**
- `revalidatePath` do slug antigo e do novo ao editar ou despublicar.
- `generateMetadata` filtra `isPublished`.
- Aceite: despublicar um artigo sintético no preview tira a página do ar em até 1 min.

### Onda 3 — otimização e estratégia

**R3.1 (P2) SEO**
- `metadataBase`, `title.template`, canonical, Open Graph com imagem.
- JSON-LD `GovernmentOrganization` (endereço, telefone, horário), `FAQPage` e `Article`.
- `sitemap.ts` com `/pauta` e `revalidate`.
- Aceite: Rich Results Test sem erros; sitemap com quatro rotas fixas mais os artigos.

**R3.2 (P2) FAQ indexável**
- `<details><summary>` nativo; respostas no HTML do servidor.

**R3.3 (P2) Peso e LCP**
- `LazyMotion` + `m` (ou CSS puro).
- Imagem do fórum sem `priority`, com `sizes` correto.
- Geist Mono só no admin.
- Aceite: JS da home ≤ 200 KB transferidos (hoje 269 KB); LCP móvel ≤ 2,5 s.

**R3.4 (P2) Erros e carregamento**
- `error.tsx`, `global-error.tsx`, `not-found.tsx` e `loading.tsx` em português; consultas de `/noticias` e `/artigos` com try/catch.

**R3.5 (P2) Notícias enxutas**
- `/noticias` com 30 itens por página; itens com mais de 90 dias desativados; filtro de categorias (Q-5). Q-5 decidida em 27/11/2026 (D-11): todas as categorias, sem filtro.
- Aceite: HTML de `/noticias` ≤ 150 KB (hoje 1,5 MB).

**R3.6 (P2) Retenção de dados** — antecipado para a onda 1 em 20/11/2026 (T028; D-6)
- Cron de expurgo ou anonimização de `contact_messages`, `appointments` e `demands` após o prazo de Q-1.
- Implementação: exclusão dos registros com `created_at` anterior a 12 meses (`lib/retention.ts`, `RETENTION_MONTHS = 12`), numa transação; `GET /api/retention` com a mesma autenticação do cron de notícias; log JSON `data_retention` só com contagens; cron diário `30 6 * * *` em `vercel.json`.
- Aceite: teste com dados sintéticos vencidos.

**R3.7 (P2) Primeira tela orientada a tarefas**
- Título curto e quatro atalhos: Tenho audiência · Consultar processo · Pauta da semana · Falar com a vara.
- Missão, visão e equipe em "Sobre".
- Aceite: os quatro atalhos visíveis sem rolagem em 390×844.

**R3.8 (P2) Métricas**
- Vercel Web Analytics (sem cookies), com eventos dos quatro atalhos, do vídeo do Zoom e de envio do formulário.
- Pergunta "Isto resolveu sua dúvida?" no guia e na pauta. Retirada em 27/11/2026 por decisão do responsável (D-12).
- Aceite: eventos visíveis no painel por quatro semanas.

## 5. Decisões tomadas

| ID | Decisão | Data |
| --- | --- | --- |
| D-1 | A versão de referência é a publicada em 2avaraciveldecariacica.org; o repositório só é alterado depois de conferir que corresponde a ela | 16/11/2026 |
| D-2 | Plano de execução em três ondas aprovado | 16/11/2026 |
| D-3 | `www` redireciona para o domínio principal; DNS nos IPs recomendados pela Vercel | 16/11/2026 |
| D-4 | Toda mudança de código passa por branch, PR, CI e preview com o Supabase `site-2avara-preview` antes de produção | 16/11/2026 |
| D-5 | R1.7 alterado: sem páginas de privacidade e termos, porque o portal não é página oficial do TJES; itens removidos do rodapé; aviso curto no formulário com o canal `lgpd@tjes.jus.br` | 20/11/2026 |
| D-6 | Q-1 resolvida: guarda de 12 meses e depois exclusão; T028 (R3.6) antecipada para a onda 1 | 20/11/2026 |
| D-7 | Q-3 resolvida: o crédito do rodapé passa a "Desenvolvido e publicado por Felipe Moulin — Instagram: @felipemoulinjus" | 21/11/2026 |
| D-8 | Q-2: o Gmail do gabinete continua como canal público por enquanto. Q-8: sessão do painel de 8 horas aprovada | 21/11/2026 |
| D-9 | Q-7: canal sobre proteção de dados no aviso do formulário passa a ser `suporte@lexintelligentia.com.br` (Lex Intelligentia) | 21/11/2026 |
| D-10 | Q-4: o TJES responde 403 ao cron vindo de `iad1` (EUA); as funções passam a rodar em `gru1` (São Paulo) antes de qualquer alternativa | 27/11/2026 |
| D-11 | Q-5: `/noticias` mostra todas as categorias do feed, sem filtrar matérias criminais | 27/11/2026 |
| D-12 | R3.8 sem a pergunta "Isto resolveu sua dúvida?"; T029 (primeira tela com atalhos) aguarda aprovação da proposta visual | 27/11/2026 |

## 6. Questões em aberto

| ID | Questão | Proposta |
| --- | --- | --- |
| Q-1 | Prazo de guarda de contatos, agendamentos e demandas | Resolvida em 20/11/2026 (D-6): 12 meses e depois exclusão |
| Q-2 | Manter o Gmail do gabinete como canal público | Mantido por enquanto (D-8); migrar para caixa institucional do TJES quando possível |
| Q-3 | Crédito do rodapé | Resolvida em 21/11/2026 (D-7): "Desenvolvido e publicado por Felipe Moulin — Instagram: @felipemoulinjus" |
| Q-4 | Se o TJES bloquear os IPs da Vercel mesmo com User-Agent | (a) curadoria manual no admin; (b) coleta por GitHub Actions gravando via endpoint autenticado; (c) retirar a seção |
| Q-5 | Filtrar matérias criminais do feed | Resolvida em 27/11/2026 (D-11): todas as categorias, sem filtro |
| Q-6 | UUID do responsável e lista da equipe para produção | Informar na execução de R1.2 |
| Q-7 | Controlador e canal do titular | Resolvida em 21/11/2026 (D-9): Lex Intelligentia; o aviso do formulário indica `suporte@lexintelligentia.com.br`. Sem política publicada (D-5) |
| Q-8 | Duração da sessão do painel | 8 horas, aprovada em 21/11/2026 (D-8) |

## 7. Implantação e reversão

1. **Banco:** exportar o esquema e os dados de produção (`pg_dump`) antes de qualquer migração. Aplicar as migrações dentro de transação. Todas são aditivas; a de RLS traz o script de reversão.
2. **Código:** branch por onda → PR → CI (`lint`, `typecheck`, `test`, `verify:local`) → deploy de preview com o Supabase de preview → checagem manual → merge em `master`.
3. **Verificação em produção:** depois de cada deploy, rodar o roteiro de §8.
4. **Reversão:** promover de volta o deploy anterior na Vercel (instantâneo; o atual é `dpl_ELgUp6MFmWJJLKtdwxKAyDRLEKAG`). Banco: script de reversão da migração de RLS. As tabelas novas podem ficar sem prejuízo.

## 8. Roteiro de verificação em produção

- [ ] `/`, `/pauta`, `/noticias` e `/artigos` respondem 200; uma rota inexistente responde 404 em português.
- [ ] Log de produção com o evento `data_retention` do cron diário; `/api/retention` sem `Authorization` responde 401.
- [ ] Consulta REST anônima às cinco tabelas retorna erro de permissão.
- [ ] Log de produção sem `read_failed` e com o resultado do coletor de notícias.
- [ ] Cabeçalhos de segurança conforme R1.6; `www` responde 308.
- [ ] Envio de contato sintético: 201, gravação única, e-mail recebido no gabinete e em cópia oculta.
- [ ] Menu, link de salto e formulário pelo teclado; menu móvel em 390 px.

## 9. Confirmações de 16/11/2026

| Item | Resultado |
| --- | --- |
| Versão no ar | `ab56f13` nos três endereços; HTML idêntico |
| Pauta | Confirmado em 20/11/2026: `hearing_schedules` e `staff_users` ausentes no banco de produção; migrações aplicadas no mesmo dia |
| RLS | Confirmado em 20/11/2026: cinco tabelas sem RLS e com leitura, escrita e exclusão para `anon`; corrigido no mesmo dia (`20261116_rls_public_tables`) |
| Notícias | Feed do TJES ativo (itens de 13/11/2026); recusa acesso automatizado; coletor falha sem log |
| Mapa | Marcador cerca de 4 km a sudoeste do Fórum |
| Contraste do rodapé | 4,23:1 e 2,66:1 (mínimo 4,5:1) |
| Painel | `ADMIN_USER_IDS` ausente em Production |

## 10. Execução da onda 2

Branch `fix/onda-2-acessibilidade`, criada de `master` em 27/11/2026. Um commit por tarefa (T012 a T021). Validação local: `bun run lint`, `bun run typecheck`, `bun test tests`, `bun run audit:production` e `bun run verify:local` (cópia local sem a fonte do Google, que o ambiente bloqueia).

| Requisito | Execução |
| --- | --- |
| R2.1 | Rotas em `app/(public)` (barra de acessibilidade, guia, VLibras e `<main>`) e `app/(admin)` (`/admin`, `/login`, `/acesso-negado`, `/servico-indisponivel`), sem script externo. O layout do grupo admin chama `connection()`: o nonce só é aplicado na renderização. `proxy.ts` casa as quatro rotas e envia a cada pedido uma CSP com nonce e `'strict-dynamic'`, sem `'unsafe-inline'`; `'unsafe-eval'` só em `next dev`, como pede o guia do Next. A CSP pública (VLibras) continua em `lib/security-headers.ts`, agora numa regra de `next.config.ts` que exclui as rotas do admin, para as duas políticas não se somarem. Sessão do painel de 8 horas a partir do login (Q-8): `activeSessionUser` em `lib/admin-policy.ts`, aplicada no Proxy e em `getUser()`; sessão mais antiga ou sem horário de login vale como ausente (401 → `/login`); cookies do Supabase com `maxAge` de 8 h. Testes: unidade (CSP de produção, nonce novo por pedido, regra pública, sessão vencida) e E2E (HTML de `/login`, `/acesso-negado` e `/servico-indisponivel` sem `vlibras.gov.br`, login hidratado sem violação de CSP). Conferido também com `next start`: o login funciona com a CSP de produção. Pendência [manual]: se o plano do Supabase permitir, ativar também o limite de sessão (time-box) de 8 h no painel do Auth de produção; a aplicação já aplica o limite sem isso. |
| R2.2 | `components/navbar-client.tsx`: itens como `<Link href="/#secao">` mais Pauta, Notícias e Artigos; `aria-current` na página (ou seção da home) atual; menu de mesa a partir de `lg` para caber os oito itens. Menu móvel com `aria-expanded`/`aria-controls`, fundo opaco (`bg-slate-900`), rolagem da página travada, Tab e Shift+Tab presos entre o botão e os links, Esc e clique fora fecham, foco volta ao botão; fecha ao navegar (mudança de rota ou clique num item). `scroll-margin-top` nas seções com `id` (`app/globals.css`). E2E em 1280 px (a partir de `/noticias`, `/artigos` e `/pauta`) e em 390 px (`e2e/navigation.spec.ts`). |
| R2.3 | Hero (`components/landing/hero.tsx`) sem `ScrollReveal`: HTML do servidor sem `opacity:0` acima da dobra. `<MotionConfig reducedMotion="user">` no layout público (`components/motion/motion-provider.tsx`). Como o `reducedMotion="user"` do framer-motion ainda anima opacidade, os blocos com `ScrollReveal`/`StaggerContainer` levam `data-reveal` e, com `prefers-reduced-motion: reduce`, o CSS mostra o estado final sem transição (vale antes da hidratação e não altera o HTML hidratado). O `fade-in` de `app/(public)/template.tsx` recebe `motion-reduce:animate-none`. E2E em `e2e/smoke.spec.ts`: HTML do hero sem `opacity:0`, `toHaveCSS("opacity", "1")` no hero e, com movimento reduzido, nenhum elemento visível da home transparente sem rolar. |
| R2.4 | `components/landing/services.tsx`: cards expansíveis são `<h3><button aria-expanded aria-controls>`; o painel fica `hidden` e `inert` enquanto recolhido (fora da ordem de Tab e da árvore de acessibilidade) e o vídeo do Zoom só é montado aberto, como antes. Cards sem conteúdo expansível (Consulta Processual, Balcão Virtual) usam `<div>` com `<h3>`, sem `<button>`; o link "Acessar" ganhou texto oculto com o nome do serviço e o aviso de nova aba. Cores ajustadas para 4,5:1 (rótulo "Atendimento", subtítulo, link e botões do painel). `@axe-core/playwright` adicionado como devDependency; `e2e/services.spec.ts` confere Tab sem links ocultos, ausência de `<button>` nos cards simples e axe (WCAG 2.1 A/AA) sem violações nos cards recolhidos e abertos. |
| R2.5 | Um único `<main id="main-content" tabIndex={-1}>` em `app/(public)/layout.tsx`; a home usa fragmento e `/pauta` usa `<div>` (antes tinham `<main>`/`id="main-content"` próprios). No grupo admin, o `<main>` fica no layout do painel e nas páginas `/login`, `/acesso-negado` e `/servico-indisponivel`. `e2e/landmarks.spec.ts`: um `main` em `/`, `/pauta`, `/noticias`, `/artigos` e num artigo; o link "Ir para conteúdo" leva o foco ao `main`. |
| R2.6 | `lib/safe-redirect.ts:safeAdminRedirect` resolve o destino como o navegador (barra invertida vale como barra) e só aceita a mesma origem com caminho `/admin` ou `/admin/...`; o resto vira `/admin`. `app/(admin)/login/page.tsx` passou a componente de servidor que valida `?redirect=` e entrega o destino ao formulário (`login-form.tsx`, com `autocomplete` `username`/`current-password`). Testes: 20 casos de unidade (`/\evil.com`, `//evil.com`, URL absoluta, `/login`, `..`) e E2E que conclui o login com sessão sintética e confere que `/login?redirect=/\evil.com` termina em `/admin`. |
| R2.7 | Assunto do contato como `z.enum` gerado de `CONTACT_SUBJECTS` (`lib/constants.ts`), a mesma lista do formulário. Honeypot `website` fora da tela e da ordem de Tab; preenchido, o contato responde 400 e nada é gravado (a resposta 201 continua reservada à gravação confirmada). `/api/client-errors`: `readJsonBody` com 8192 bytes (413 acima), rate limit `rl:client-errors` (30 por 15 min; 503 sem a proteção em produção, 429 na cota), só as chaves `message`, `reason`, `source`, `lineno`, `colno` e `status` em `data`, e só o caminho (`pathname`) de `url` e `source` no log (`lib/client-errors.ts`). Ações do painel: `answeredBy`, `confirmedBy` e `resolvedBy` gravam o e-mail da conta devolvida por `requireAdmin()` (antes, o texto fixo "admin" enviado pelo navegador); `zoomLink` vazio ou URL `https` de `zoom.us`/`zoom.com` (subdomínios aceitos; sem usuário, senha ou porta); observações com no máximo 5000 caracteres; telas do painel mostram erro em vez de travar. `/api/news?limit` já era validado com zod (1 a 50, padrão 10) e tem testes em `tests/news.test.ts`. Testes de unidade em `tests/validators.test.ts` e `tests/stabilization.test.ts`. |
| R2.8 | `components/landing/contact-form.tsx`: `autocomplete` `name`, `tel` e `email` (com `inputMode="tel"`); dica de formato visível sob cada campo e ligada por `aria-describedby`; validação no envio com as mesmas regras do servidor (`noValidate`, sem os balões nativos): campo inválido recebe `aria-invalid` e a mensagem de erro entra na descrição; o foco vai ao primeiro campo inválido; um 400 com `details` do servidor marca o campo rejeitado. Sucesso: o foco vai ao título "Mensagem enviada!" dentro do `role="status"`. Telefone e e-mail do gabinete como `tel:+552732465641` e `mailto:`. O aviso de uso dos dados acima do botão Enviar e seu `aria-describedby` foram mantidos (E2E `footer-notice` inalterado). `e2e/contact-form.spec.ts`: envio só com teclado, erros anunciados na descrição acessível, foco no sucesso, honeypot fora do Tab e axe sem violações no formulário. |
| R2.9 | Rodapé (`components/footer.tsx`): textos em `slate-300` e crédito em `amber-400` sobre `slate-950` (todos acima de 4,5:1, medidos no navegador para cada texto visível); `h2` oculto "Informações do portal" acima dos `h3`; telefone e e-mail como `tel:`/`mailto:`. Crédito "Desenvolvido e publicado por Felipe Moulin — Instagram: @felipemoulinjus" mantido. Mapa: embed `https://www.google.com/maps?q=-20.3332,-40.3767&z=16&output=embed` (`FORUM_MAP_EMBED_URL`), marcador nas coordenadas do Fórum, já permitido pela CSP pública (`frame-src https://www.google.com`). `/pauta` com falha de leitura mostra `HearingScheduleUnavailable` (`role="alert"`): Balcão Virtual do TJES e telefone do gabinete. Enquanto vale o aviso "Sem audiências designadas até 31/01/2027.", ele continua tendo precedência, como antes. Testes: E2E de contraste, títulos e mapa; unidade da mensagem de erro. Pendência [manual]: conferir visualmente, no preview, que o marcador do mapa está sobre o Fórum. |
| R2.10 | `updateArticle` lê o slug anterior e recebe o novo (`returning`); `toggleArticlePublish` recebe o slug; ambos revalidam `/admin/artigos`, `/artigos`, `/` e `/artigos/<slug>` de cada slug (`lib/articles.ts:articleRevalidationPaths`). `generateMetadata` e a página usam a mesma consulta com `cache()` (`getPublishedArticle`), que filtra `isPublished`: artigo despublicado não expõe título, resumo nem imagem. `export const revalidate = 60` na página do artigo como rede de segurança para o prazo de 1 min. Teste com PGlite descartável em processo separado (`tests/article-revalidation.test.ts`): troca de slug revalida o antigo e o novo; despublicar revalida a página e tira os metadados. Pendência [manual]: o aceite em preview (despublicar artigo sintético e conferir a página fora do ar em até 1 min) depende do deploy de preview. |

Gate final da onda 2 (27/11/2026, commit da T021): `bun run lint` e `bun run typecheck` sem erros; `bun test tests` com 236 testes aprovados (801 verificações); `bun run audit:production` com 99 entradas de produção e nenhum aviso aplicável (80 avisos no lockfile inteiro, de ferramentas de desenvolvimento); `bun run verify:local` com build de produção e 90 testes Playwright aprovados, numa cópia local em que só a fonte Geist do Google foi desligada (o ambiente bloqueia `fonts.googleapis.com`; a alteração não está no repositório). O login também foi conferido com `next start` sob a CSP de produção, sem violação. Falta a verificação em preview e produção (T022).

## 11. Execução da onda 3

Branch `feat/onda-3-otimizacao`, criada de `master` (`395b94f`, com a onda 2) em 27/11/2026. Um commit por tarefa (T023 a T027 e T030). T028 já estava feita (onda 1). T029 (primeira tela com atalhos) aguardava a aprovação da proposta visual (D-12); foi feita depois, na branch `feat/primeira-tela-atalhos` (linha R3.7 abaixo). T031 fica aberta até a verificação em preview/produção e as métricas da primeira semana.

Medições locais (27/11/2026): build de produção com `next start` (gzip, como o servidor do Next entrega), banco PGlite descartável com 600 notícias sintéticas (uma por dia) e Chromium 1243. "Antes" é `master` `395b94f`; "depois" é o último commit da onda 3. A Vercel entrega com brotli: os números em brotli foram calculados sobre os mesmos arquivos. Os scripts externos (VLibras) não entram na conta, porque o ambiente local não os alcança.

| Medida | Antes | Depois | Meta |
| --- | --- | --- | --- |
| JS transferido da home (gzip) | 277,2 KB (825 KB sem compressão, 12 arquivos) | 192,2 KB (570 KB sem compressão, 12 arquivos) | ≤ 200 KB |
| JS da home em brotli | 225,7 KB | 150,7 KB | — |
| HTML de `/noticias` | 3,14 MB (600 notícias numa página) | 100,7 KB (30 notícias; 10,9 KB com gzip) | ≤ 150 KB |
| LCP móvel emulado (390×844, RTT 150 ms, 1,6 Mbps, CPU 4×) | 1,02 s | 1,08 s (elemento: título do hero) | ≤ 2,5 s |

O LCP é o título do hero (texto), nos dois casos; a diferença está no ruído da emulação. A meta de LCP precisa ser conferida no preview (PageSpeed Insights ou dados de campo); a emulação local não a substitui.

T029 (27/11/2026), mesmas condições: "antes" é `master` `bfb2074` (onda 3); "depois" é o commit da T029. JS transferido da home (gzip): 192,2 KB → 192,6 KB (+0,4 KB, 12 arquivos nos dois; 151,1 KB em brotli). HTML da home: 122,4 KB → 132,2 KB (20,5 KB → 22,1 KB com gzip). LCP móvel emulado (390×844, RTT 150 ms, 1,6 Mbps, CPU 4×): 1,22 s antes; 1,16 s e 1,22 s depois (duas medições), com o elemento de LCP no título do hero ("Como podemos ajudar?") nos dois casos.

| Requisito | Execução |
| --- | --- |
| R3.1 | `lib/seo.ts`: `SITE_URL` (`https://2avaraciveldecariacica.org`), `pageMetadata` (título, descrição, canonical e Open Graph completo por página, porque o Next junta metadados de forma rasa) e os geradores de JSON-LD. Layout raiz com `metadataBase`, `title.template` "%s \| 2ª Vara Cível de Cariacica", Open Graph e cartão `summary_large_image` com `public/images/og-portal.jpg` (1200×630, foto do Fórum e destaque laranja). O título da home deixou de dizer "TJES"; nenhum texto chama o portal de oficial (teste). JSON-LD `GovernmentOrganization` na home (endereço, telefone, e-mail, `parentOrganization` TJES; horário em `contactPoint.hoursAvailable` e no `location` do tipo `Courthouse`, com as coordenadas do Fórum), `FAQPage` na home e `Article` em cada artigo; serialização com `<` escapado (guia do Next). Endereço e horário passaram a constantes estruturadas (`ADDRESS`, `OFFICE_HOURS`); o texto exibido não mudou. `sitemap.ts`: `/`, `/pauta`, `/noticias`, `/artigos` e os artigos publicados, `revalidate = 3600`. `robots.ts`: fora do índice as quatro rotas do grupo admin e `/api/`. Testes: `tests/seo.test.ts` e `e2e/seo.spec.ts`. Pendência [manual]: Rich Results Test e validador do schema.org sobre o preview. |
| R3.2 | `components/landing/faq.tsx` virou componente de servidor com `<details>/<summary>`: respostas no HTML (teste no HTML bruto), teclado nativo (Enter e Espaço), seta girando só por CSS. Rótulos em amber-800 (amber-500 sobre branco ficava abaixo de 4,5:1). `e2e/faq.spec.ts` com axe sem violações. |
| R3.3 | CSS puro em vez de `LazyMotion`: `components/motion/use-reveal.ts` mantém a API de `ScrollReveal`/`StaggerContainer`; o HTML do servidor é o estado final visível e só blocos abaixo da dobra ficam ocultos depois da hidratação (nada com movimento reduzido). framer-motion saiu do projeto. Assunto do contato em `<select>` nativo (o Select do Base UI trazia popup e floating-ui para a home). Foto do Fórum sem `priority`, com `loading="lazy"` e `sizes="(max-width: 480px) calc(100vw - 2rem), 448px"`. Geist Mono só em `app/(admin)/layout.tsx`. Números na tabela acima; `e2e/performance.spec.ts`. |
| R3.4 | `error.tsx` em `app/(public)`, `app/(admin)` (com `<main>` próprio) e `app/(admin)/admin`; `global-error.tsx` com documento próprio; `not-found.tsx` na raiz (endereços sem rota, cabeçalho simples e um `<main>`), em `app/(public)` e no painel, com `app/(admin)/admin/[...path]` para o 404 do painel sair dentro do layout, depois da sessão e com a CSP com nonce. `loading.tsx` em `/noticias` e no painel; nenhum na raiz do grupo público, para o 404 de artigo continuar com status 404 (um `loading` acima faria o streaming começar com 200). As telas registram só o `digest`. `/noticias` e `/artigos` tratam falha de banco com aviso. Verificado com `next start`: endereço desconhecido e artigo inexistente respondem 404 com um `<main>`. Comportamento do Next anotado: o 404 de artigo (rota ISR) chega com o corpo montado pelo JavaScript; status e `noindex` vêm no HTML, como antes desta onda. Testes: `tests/error-pages.test.tsx` e `e2e/error-pages.spec.ts`. |
| R3.5 | `lib/news.ts` e `lib/news-pagination.ts`: 30 por página, `?pagina=N` (inválido vira 1; além do fim, aviso, link para a primeira e `noindex`), só itens ativos dos últimos 90 dias pelo relógio do banco (sem data de publicação, vale a coleta); os antigos ficam na tabela e no painel. Todas as categorias (D-11). A prévia da home usa a mesma regra. Paginação por links com `aria-current`, `rel` prev/next e canonical por página. Cartões enxutos (título como link para o TJES, resumo de até 240 caracteres, `<time>`). A página passou a ser renderizada a cada pedido, por causa do parâmetro. `verify:local` insere 35 notícias fictícias recentes e uma antiga. Testes: `tests/news-pagination.test.ts` (PGlite descartável) e `e2e/news.spec.ts` (inclui HTML ≤ 150 KB no servidor de desenvolvimento, maior que o de produção, e axe). |
| R3.6 | Feito na onda 1 (T028). Sem alteração. |
| R3.7 | Feito em 27/11/2026 (T029, branch `feat/primeira-tela-atalhos`), conforme a proposta visual aprovada (celular 390×844 e computador). `components/landing/hero.tsx`: linha "2ª Vara Cível — Comarca de Cariacica — ES" (no celular, "Comarca de Cariacica — ES"), título "Como podemos ajudar?", "Escolha o que você precisa resolver hoje." e quatro atalhos como links (grade 2×2 no celular, quatro colunas a partir de `lg`; alvo de 150/190 px; ícones `aria-hidden`): "Tenho audiência" → `/#audiencias-virtuais` (o card "Audiências Virtuais", com o vídeo do Zoom, ganhou a âncora e abre ao chegar por ela, também ao repetir o atalho); "Consultar processo" → `PROCESS_LOOKUP_URL` (`https://portaldeservicos.pdpj.jus.br/consulta`, o mesmo link do card "Consulta Processual"), em nova aba, com `rel="noopener noreferrer"` e "(abre em nova aba)" no nome acessível; "Pauta da semana" → `/pauta`; "Falar com a vara" → `/#contato`. Abaixo dos atalhos, o aviso de `hearingSuspensionNotice()` quando houver (continua também na `/pauta` e no bloco da pauta da home). Cada atalho chama `trackHomeShortcut` com o seu identificador; só o link (`components/landing/home-shortcut-link.tsx`) é componente de cliente, o resto do hero sai no HTML do servidor, sem animação de entrada (R2.3). Nome do cabeçalho com 20 px (24 px a partir de `xl`), sem quebrar o menu de mesa em 1024 px nem o botão do menu móvel em 390 px. O hero ocupa a primeira tela (altura da janela menos barra e cabeçalho), como na proposta: sem isso a foto do Fórum, logo abaixo, aparecia em 390×844 e virava o elemento de LCP (1,73 s na emulação lenta). A missão, a visão e a equipe já estão na seção do magistrado; a frase de missão que ficava no hero saiu. Testes: `tests/home-shortcuts.test.tsx` e `e2e/home-shortcuts.spec.ts` (atalhos visíveis sem rolar em 390×844, navegação e evento de cada atalho, axe, teclado, cabeçalho em 390, 1024 e 1280 px). |
| R3.8 | `@vercel/analytics` (sem cookies) em `components/web-analytics.tsx`, só no layout público e só em builds da Vercel (`VERCEL=1`). CSP pública sem mudança: script e envio em `/_vercel/insights/*`, mesma origem, cobertos por `'self'` (teste). Eventos sem dados pessoais e sem efeito se falharem: `zoom_tutorial_play` (primeira reprodução do vídeo no card "Audiências Virtuais") e `contact_form_sent` (depois do 201; só o assunto). Sem a pergunta de satisfação (D-12). Testes: `tests/analytics.test.tsx` e `e2e/analytics.spec.ts`. Pendência [manual]: ativar Web Analytics no projeto da Vercel; até lá o script responde 404 e nada é coletado. |

Gate final da onda 3 (27/11/2026, commit da T030): `bun run lint` e `bun run typecheck` sem erros; `bun test tests` com 260 testes aprovados (954 verificações); `bun run audit:production` com 97 entradas de produção e nenhum aviso aplicável (80 avisos no lockfile inteiro, de ferramentas de desenvolvimento); `bun run verify:local` com build de produção e 119 testes Playwright aprovados, numa cópia local em que só a fonte Geist do Google foi desligada (o ambiente bloqueia `fonts.googleapis.com`; a alteração não está no repositório). Falta a verificação em preview e produção (T031), incluindo PageSpeed, Rich Results Test e a ativação manual do Web Analytics.
