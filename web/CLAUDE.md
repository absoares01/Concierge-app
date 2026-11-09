# Desenvolvimento do app web (pasta `web/`)

Este arquivo vale para quem programa o app. O `CLAUDE.md` da raiz descreve o agente Concierge (atendimento de viagens) e não se aplica ao código desta pasta.

- Stack: Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (`@supabase/ssr`). Textos da interface em português do Brasil.
- **Segurança é do banco:** toda regra de acesso vive em `supabase/schema.sql` (RLS). Mudou o schema? Rode `npm run test:rls` e acrescente casos ao teste.
- Gravações só em `app/equipe/acoes.ts`, sempre começando com `exigirEquipe()`. A chave de serviço (`lib/supabase/admin.ts`) só pode ser usada depois dessa checagem.
- **Nenhum número sem fonte:** preços vêm da SerpApi ou de cotação manual com fonte; o que não vier aparece como "não informado". Dados de exemplo nunca vão para a viagem.
- Links de terceiros passam por `linkSeguro()` (só http/https).
- O cliente não lê a tabela `clientes` (por causa de `notas_internas`). Não crie colunas internas em `viagens`, `itens_viagem` ou `checklist_viagem`: o cliente lê todas as colunas delas.
- Cores, fontes e raios: tokens em `app/globals.css`, documentados em `../docs/DESIGN.md`.
- Antes de concluir: `npm run typecheck`, `npm run test:logic`, `npm run test:rls`, `npm run build`.
- **Conduta no GitHub:** siga `../docs/BOAS-PRATICAS-GITHUB.md` (a conta já foi suspensa uma vez). Nada de cópias de projetos de terceiros, segredos, executáveis ou ações automáticas em massa. A mesclagem na `main` é feita por uma pessoa.
