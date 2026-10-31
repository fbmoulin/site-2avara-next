# Portal da 2ª Vara Cível de Cariacica

Leia `AGENTS.md` e a documentação da versão instalada do Next em `node_modules/next/dist/docs/` antes de alterar código. Veja `README.md` e `docs/STABILIZATION.md` para configuração e limites de validação.

- Next 16.4.2, React 19.3.1, Node 24.x, Bun 1.4.3; use somente Bun para dependências e scripts.
- Supabase Auth verifica identidade; `lib/auth.ts:requireAdmin` aplica `ADMIN_USER_IDS` validado no servidor. Todas as ações e o upload precisam dessa guarda.
- `proxy.ts` renova a sessão e preserva cookies. Não o trate como proteção suficiente para operações.
- O guia público é determinístico (`lib/assistant.ts`), não chama modelos, não coleta casos nem confirma registro ou reserva. Preserve esse limite ao editar textos e atalhos.
- Contato: persistência confirmada em 201, notificação depois da resposta; não converter falha de notificação em falha de gravação. Não registrar dados pessoais no log.
- Rate limit obrigatório em produção; ausência/erro de dependência = 503; cota esgotada = 429.
- `bun run verify:local` gera banco descartável e executa build + E2E. Nunca usar produção como fixture.
- SQL via Drizzle e postgres-js (`prepare:false`, `max:1`); não alterar esquema de produção nos testes.
- Interface em português; componentes de servidor por padrão; nomes de código em inglês.
- Acessibilidade deve ser testada. Barra de contraste e VLibras não certificam conformidade WCAG.
