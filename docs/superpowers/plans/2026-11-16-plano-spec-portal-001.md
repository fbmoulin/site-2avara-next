# Plano de implementação — SPEC-PORTAL-001

> **Para agentes:** executar tarefa por tarefa, na ordem, com o sub-skill superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans. Marque `- [x]` ao concluir. Cada tarefa termina com testes verdes e commit próprio. Leia `CLAUDE.md`, `AGENTS.md` e `docs/superpowers/specs/2026-11-16-spec-portal-001-estabilizacao.md` antes de começar.

**Objetivo:** levar o portal ao estado descrito na SPEC-PORTAL-001, em três ondas.
**Base:** `master` em `ab56f13`. Uma branch por onda: `fix/onda-1-producao`, `fix/onda-2-acessibilidade`, `feat/onda-3-otimizacao`.
**Gate de cada tarefa:** `bun run lint && bun run typecheck && bun test tests`; nas tarefas com UI, também `bun run verify:local`.

Tarefas marcadas **[manual]** são feitas pelo responsável no painel (Supabase, Vercel ou Hostinger) ou com a autorização dele. O agente prepara o passo a passo e confere o resultado.

---

## Onda 1 — produção operacional (branch `fix/onda-1-producao`)

- [ ] **T001 [manual] Cópia de segurança do banco de produção** (R1.1)
  `pg_dump` de esquema e dados do Supabase de produção, guardado fora do repositório. Aceite: arquivo gerado e restauração testada num banco descartável.

- [ ] **T002 Migração de RLS** (R1.1)
  Criar `lib/db/migrations/20261116_rls_public_tables.sql` (ENABLE RLS + `REVOKE ALL ... FROM anon, authenticated` nas cinco tabelas) e `..._rollback.sql`. Teste em PGlite: depois da migração, o papel anon não lê as tabelas.

- [ ] **T003 [manual] Aplicar migrações em produção** (R1.1) — depende de T001 e T002
  Ordem: `20261024_hearing_schedules.sql`, `20261024_staff_and_drafts.sql`, `20261116_rls_public_tables.sql`. Desativar o cadastro público no Supabase Auth. Aceite: consultas de §8 da spec.

- [ ] **T004 [manual] ADMIN_USER_IDS em Production e equipe** (R1.2) — depende de T003
  Definir a variável com o UUID do responsável e fazer redeploy. Cadastrar a equipe em `/admin/usuarios`. Aceite: responsável e estagiária com os acessos esperados.

- [ ] **T005 Coletor de notícias** (R1.3)
  Arquivos: `lib/news-scraper.ts`, `app/api/news/route.ts`, `tests/`.
  - User-Agent e Accept; remover r.jina.ai; validar host `tjes.jus.br`; log estruturado; `revalidatePath`; `timingSafeEqual` no segredo; `limit` com zod.
  - Testes: feed de exemplo, link fora do domínio descartado, segredo errado = 401.

- [ ] **T006 Home revalidada** (R1.4)
  `export const revalidate = 3600` em `app/page.tsx`. Verificar no build que `/` aparece como ISR.

- [ ] **T007 Rotas sem uso → 410** (R1.5)
  `app/api/appointments/route.ts` e `app/api/demands/route.ts` retornam 410 sem efeitos. Atualizar testes e o README.

- [ ] **T008 Cabeçalhos** (R1.6)
  `next.config.ts`: CSP revista e `Permissions-Policy`. E2E confere os cabeçalhos; checar o VLibras no preview.

- [ ] **T009 [manual] Variáveis da Vercel** (R1.6)
  Remover `OPENAI_API_KEY`; recriar como Sensitive `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` (Production).

- [ ] **T010 Aviso de uso dos dados** (R1.7, alterado em 20/11/2026 por decisão do responsável)
  Sem páginas de privacidade e termos. Remover os dois itens do `components/footer.tsx` (e o bloco "Institucional"), corrigir o contraste do crédito e pôr o aviso curto com `lgpd@tjes.jus.br` em `components/landing/contact-form.tsx`. Feito na branch `fix/onda-1-rodape-retencao`.
- [ ] **T028 Expurgo de dados pessoais** (R3.6) — antecipada da onda 3 em 20/11/2026; Q-1 resolvida (12 meses, exclusão)
  `lib/retention.ts`, `app/api/retention/route.ts`, `lib/cron-auth.ts` (autenticação comum aos crons), cron `30 6 * * *` em `vercel.json`, testes com mocks e com PGlite. Feito na branch `fix/onda-1-rodape-retencao`.

- [ ] **T011 Verificação da onda 1**
  Preview com o Supabase de preview → merge → roteiro de §8 da spec em produção. Executar o cron manualmente uma vez e conferir as notícias. Se o TJES recusar, abrir T011a conforme Q-4.

## Onda 2 — estrutura e acessibilidade (branch `fix/onda-2-acessibilidade`)

- [x] **T012 Grupos de rotas público/admin** (R2.1) — feito em 27/11/2026
  Mover páginas para `app/(public)` e `app/(admin)`; VLibras, guia e barra só no público; nonce de CSP no `proxy.ts` para `/admin`. E2E: HTML do admin sem scripts externos.

- [x] **T013 Navegação e menu móvel** (R2.2) — feito em 27/11/2026
  `components/navbar-client.tsx`: `<Link>`, itens de rota, Esc, clique fora, fecha ao navegar, rolagem travada, foco devolvido. E2E desktop e 390 px.

- [x] **T014 Hero e movimento** (R2.3) — feito em 27/11/2026
  `components/landing/hero.tsx`, `components/motion/*`, `MotionConfig`. Corrigir o `e2e/smoke.spec.ts` para conferir a opacidade.

- [x] **T015 Cards de serviços** (R2.4) — feito em 27/11/2026
  `components/landing/services.tsx`: `inert`/renderização condicional, `aria-expanded`, `aria-controls`. Teste com axe.

- [x] **T016 Landmarks e link de salto** (R2.5) — feito em 27/11/2026
  `app/(public)/layout.tsx`, `app/(public)/page.tsx`, `app/(public)/pauta/page.tsx`.

- [x] **T017 Redirecionamento do login** (R2.6) — feito em 27/11/2026
  `app/(admin)/login/page.tsx` e `lib/safe-redirect.ts`, com teste do caso `/\evil.com`.

- [x] **T018 Validações do servidor** (R2.7) — feito em 27/11/2026
  `lib/validators.ts`, honeypot no formulário, `app/api/client-errors/route.ts`, `app/(admin)/admin/actions.ts` e clientes do admin.

- [ ] **T019 Formulário de contato** (R2.8)
  `components/landing/contact-form.tsx`: `autocomplete`, ARIA de erro, foco no sucesso, `tel:`/`mailto:`.

- [ ] **T020 Rodapé, mapa e pauta** (R2.9)
  `components/footer.tsx` (contraste, `h2` oculto), embed do mapa, mensagem de erro de `/pauta`.

- [ ] **T021 Artigos** (R2.10)
  `app/admin/actions.ts` (`revalidatePath` do slug) e `app/artigos/[slug]/page.tsx` (`isPublished` no `generateMetadata`; `cache()` na consulta).

- [ ] **T022 Verificação da onda 2**
  Preview → merge → roteiro de §8, com teclado e leitor de tela nos fluxos principais.

## Onda 3 — otimização e estratégia (branch `feat/onda-3-otimizacao`)

- [ ] **T023 Metadados e JSON-LD** (R3.1)
- [ ] **T024 FAQ com `<details>`** (R3.2)
- [ ] **T025 LazyMotion, imagem e fontes** (R3.3) — medir JS e LCP antes e depois
- [ ] **T026 Páginas de erro e carregamento** (R3.4)
- [ ] **T027 Notícias paginadas e filtradas** (R3.5) — depende de Q-5
- T028 Expurgo de dados pessoais (R3.6) — antecipada para a onda 1 em 20/11/2026
- [ ] **T029 Primeira tela com atalhos** (R3.7) — proposta visual aprovada pelo responsável antes de codificar
- [ ] **T030 Web Analytics e pergunta de satisfação** (R3.8)
- [ ] **T031 Verificação da onda 3 e linha de base** — registrar métricas da semana 1 no README

## Dependências

```
T001 → T003 → T004
T002 → T003
T005, T006, T007, T008, T010 independentes → T011
T012 antes de T013 e T016
T029 depende de T023 e T024 (estrutura da home)
```
