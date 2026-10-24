# Painel administrativo em dispositivos móveis

## Correção — 24/10/2026

O menu de 256 px permanecia ao lado do conteúdo no celular. O painel agora usa uma coluna abaixo de 1024 px, com navegação recolhível acima do conteúdo; a navegação lateral permanece no desktop. O conteúdo pode encolher corretamente dentro do flex layout, sem esconder overflow globalmente.

- Menu com nome acessível, estado expandido, página atual e fechamento por Escape com retorno de foco.
- Formulários de usuários e pauta respeitam a largura disponível, inclusive campos nativos de data/hora e e-mails longos.
- Ações empilhadas no celular, controles de pelo menos 44 px e fonte mínima de 16 px nos campos para evitar zoom automático do iOS.
- Cabeçalho e barra de acessibilidade ajustados; link de salto continua acessível por teclado.
- Permissões, autenticação e ações de servidor preservadas.

## Verificação visual local

Componentes reais AdminSidebar, StaffManager e ScheduleEditor renderizados em uma rota temporária local com dados fictícios, removida antes do build e do commit. Nenhuma rota de teste ou exceção de autenticação publicada.

Larguras verificadas: 320, 375, 390, 430, 768 e 1280 px, altura 844 px. Em todas, com fonte normal e ampliada a 125%, a largura do documento não ultrapassou a viewport. Verificados formulário de cadastro, conta com e-mail longo, audiência preenchida, abertura/fechamento do menu e retorno de foco após Escape. Captura de 390 px inspecionada visualmente.

Execução em Chromium local; não substitui teste físico no Safari/iPhone.
