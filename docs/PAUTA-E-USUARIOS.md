# Pauta semanal e usuários

## Fluxo aprovado

A equipe cadastra a pauta em `/admin/pauta`. O formulário sugere terça, quarta e quinta às 14h, 15h e 16h, com tipo Instrução e julgamento e modalidade ajustável. Datas excepcionais são aceitas, mas o servidor exige no máximo três audiências por dia e pelo menos uma hora entre os horários. Não são criados agendamentos reais automaticamente.

A página `/pauta`, acessível na página inicial, consulta a semana corrente a cada requisição no fuso America/Sao_Paulo. A pauta revisada de uma semana futura passa a aparecer na segunda-feira à meia-noite local. Essa transição ocorre na própria consulta, sem cron, mensagem ou tarefa externa. Sem liberação, mostra “ainda não foi publicada”; uma semana explicitamente liberada sem registros mostra que não há audiências na pauta. A semana anterior não é reapresentada como atual.

O responsável/assessor usa “Revisar e liberar semana” para publicar uma cópia do rascunho ou “Retirar publicação” para suspendê-la. Salvar rascunho preserva a versão pública existente. As orientações remetem ao Zoom e ao link recebido na intimação; não há campo para senha/link privado. A identificação pública opcional deve conter apenas informações aprovadas para divulgação.

## Perfis

| Perfil | Permissões |
| --- | --- |
| Responsável (`ADMIN_USER_IDS`) | Todas as áreas, incluindo gestão de usuários |
| Assessor | Rotinas administrativas e edição/liberação da pauta; sem gestão de usuários |
| Estagiário | Apenas edição do rascunho da pauta; sem publicação, retirada de publicação ou acesso a outras áreas |

`staff_users` guarda os perfis no servidor, por UUID autenticado do Supabase. Metadados controlados pelo usuário não concedem acesso. O Proxy restringe páginas e cada Server Action revalida a permissão. Usuário desativado perde acesso nas próximas requisições. Falha na consulta de perfis resulta em indisponibilidade, nunca em autorização.

Em `/admin/usuarios`, o responsável pode cadastrar uma conta com e-mail, categoria e senha inicial (mínimo de 12 caracteres), vincular uma conta já existente após conferência no Supabase e alterar/desativar acessos. O cadastro/vínculo requer `SUPABASE_SERVICE_ROLE_KEY` server-only do MESMO projeto Supabase. A senha não é armazenada no banco da aplicação nem retornada/logada. Não são enviados convites por e-mail. Se a identidade for criada mas a gravação de permissões falhar, fica sem acesso; o responsável pode conferir o UUID e vinculá-la. A interface não permite rebaixar/remover os responsáveis definidos no ambiente.

## Banco e implantação

Aplicar, nesta ordem, somente ao banco correto:

1. `lib/db/migrations/20261024_hearing_schedules.sql`
2. `lib/db/migrations/20261024_staff_and_drafts.sql`

As tabelas têm RLS habilitada e acesso direto revogado para anon/authenticated. A aplicação usa a conexão server-only. A pauta usa versão otimista para impedir sobrescrita silenciosa em duas gravações concorrentes. Não há dados reais nos scripts.

As migrações foram executadas no projeto isolado `site-2avara-preview` em 24/10/2026; não executar em produção sem concluir a validação. A chave administrativa do Supabase ainda precisa ser configurada no Preview para testar criação real de usuários. Redis e integrações externas continuam pendentes de validação real.

## Verificação local em 24/10/2026

- 76 testes aprovados, 329 assertions: inclui timeout real do SDK Upstash, bloqueio de 19 ações administrativas, perfis, revogação, falha de consulta, datas e limites.
- Banco descartável PGlite: gravações concorrentes, versão otimista, rascunhos e publicação separados, bloqueio de publicação/retirada pelo estagiário e falha de persistência controlada.
- Build e checagem TypeScript aprovados; lint aprovado.
- 30 testes Playwright aprovados, incluindo pauta pública não publicada e redirecionamento do editor anônimo. Um contato sintético persistido exatamente uma vez.
- Não confundir esses testes com validação de contas reais no Preview. O último login no endereço fixo ficou pendente e a página de verificação excedeu o tempo de carregamento.

Antes de produção: validar responsável, assessor e estagiário com contas de teste, criar/editar/liberar uma pauta sintética no Preview, verificar ausência de acesso do estagiário aos demais dados, configurar e validar Redis e notificações, revisar o conteúdo público e então decidir sobre promoção.
