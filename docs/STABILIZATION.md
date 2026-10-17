# Estabilização inicial

## Escopo e resultado

Este lote atualiza Next.js para 16.4.2, React/React DOM para 19.3.1 e mantém Node 24.x e Bun 1.4.3. Remove o provedor de IA do guia, centraliza a autorização administrativa por UUID verificado e corrige o ciclo de envio do contato. Não altera o esquema das tabelas nem executa migrações em ambientes externos.

A autorização não depende de e-mail ou metadados editáveis pelo usuário. Proxy, layout, ações e upload usam a mesma política; chamadas diretas às operações continuam protegidas. Erros do provedor de identidade resultam em indisponibilidade, sem conceder acesso. Cookies renovados são encaminhados ao navegador e à renderização da requisição atual.

O guia usa opções fechadas e respostas previamente definidas. Seu texto informa que não registra demandas nem reserva horários. A compatibilidade SSE para clientes antigos devolve apenas orientação fixa, sem refletir texto enviado ou chamar modelos.

O contato confirma sucesso somente após persistência. A notificação é independente, executada com `after()`. Uma falha de rede pode deixar o resultado incerto: a interface preserva os campos e orienta consultar a equipe antes de reenviar. A trava de envio evita concorrência no mesmo formulário, mas não é idempotência persistente.

## Evidências locais

- Build otimizado de produção com banco descartável PostgreSQL/PGlite e esquema gerado pelo Drizzle.
- ESLint e TypeScript sem erros; 28 testes de unidade (81 verificações) aprovados, cobrindo de autorização, Proxy/cookies, limites, contratos, persistência e falha de notificação.
- 28 testes Playwright/Chromium aprovados: páginas públicas, APIs com banco descartável, formulário (201, 400, 422, 429, 503 e falha de rede), envio concorrente, guia por teclado e limites da tela móvel.
- Consulta SQL após a suíte confirma exatamente um contato de integração persistido.
- Auditoria do grafo de produção: 107 entradas examinadas, nenhum aviso aplicável encontrado na consulta realizada. O lockfile completo ainda contém 66 avisos distintos, associados a ferramentas de desenvolvimento; devem ser tratados em manutenção separada. A auditoria é temporal, não uma garantia permanente.

O build usa `NODE_ENV=production`; os testes de interface usam o servidor de desenvolvimento e credenciais fictícias. A ausência de Redis em produção é testada por unidade e bloqueia as rotas protegidas. A CI repete build e testes sem segredos. Não foram verificados nesta etapa login real, renovação real de tokens, RLS ou Storage no Supabase.

## Condições antes de promover

1. Definir `ADMIN_USER_IDS` com UUIDs reais das contas autorizadas no Supabase, exclusivamente no servidor. Lista ausente ou inválida bloqueia o painel.
2. Confirmar Supabase URL/chave pública, conexão do banco e chave de serviço do upload no ambiente de homologação.
3. Confirmar Redis URL/token e testar cota, indisponibilidade e identificação do IP no proxy de hospedagem. A ausência da proteção causa 503 em produção.
4. Testar anonimamente, com conta comum e com administrador; conferir leitura e escrita do banco, políticas RLS e bucket `images`. A guarda da aplicação não substitui essas políticas.
5. Validar o envio real do Resend e acompanhar eventos de notificação pendente. Não há retentativa durável.
6. Revisar o preview e o resultado da CI antes de merge/promoção. Esta implementação não modifica as variáveis ou o deployment de produção.

## Próximos lotes

Tratar avisos restantes das ferramentas, idempotência e fila de notificações; revisar retenção de dados e logs, CSP, cache de notícias, paginação e observabilidade. Os endpoints existentes de agendamentos/demandas precisam de revisão de negócio própria; o guia não os aciona.
