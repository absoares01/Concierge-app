# Concierge · app web (Soares pelo Mundo)

O app da assessoria, com duas áreas:

| Área | Quem | O que faz |
|------|------|-----------|
| **Equipe** (`/equipe`) | Rafhaela e equipe | Acesso total: clientes, viagens, buscas reais de voos e hospedagem, cotações manuais (milhas, Airbnb, passeios), roteiro, checklist de documentos, publicar para o cliente |
| **Cliente** (`/minhas-viagens`) | Cada cliente | Modo leitura: só as viagens **publicadas** que a equipe associou a ele, com voos, hospedagem, roteiro dia a dia, documentos, orçamento e links de compra |

Quem garante essa separação é o próprio banco (regras de segurança por linha no Supabase), não só a tela. As regras são testadas com `npm run test:rls`.

Identidade visual: terracota e creme (`../docs/DESIGN.md`).

## Como funciona o dia a dia

1. A equipe cadastra o **cliente** (nome, e-mail, WhatsApp, notas internas que o cliente nunca vê).
2. Cria a **viagem** do cliente: destino, datas, pacote (Essencial, Completo, Premium), teto de orçamento e um recado.
3. Monta a viagem:
   - **Buscar voos**: preços reais do Google Flights (SerpApi), ranking "Melhor" explicado, botão "Adicionar à viagem".
   - **Buscar hospedagem**: Google Hotels (SerpApi), hotéis e aluguel por temporada, com preço total e preços por site.
   - **Item manual**: cotações com milhas (Smiles, LATAM Pass, Azul Fidelidade), anúncios do Airbnb, passeios, trens, seguro e atividades do roteiro.
   - Cada item pode ser **sugestão**, **recomendado** ou **reservado**, e pode ficar **oculto** do cliente.
   - **Checklist** de documentos com link da fonte oficial.
4. Confere em **"Ver como o cliente"** e clica em **"Publicar para o cliente"**.
5. Na página do cliente, clica em **"Liberar acesso"**. O cliente entra em `/login` com o e-mail dele e recebe um link de acesso (sem senha).

O orçamento do cliente soma só os itens **recomendados** e **reservados**: as sugestões são alternativas e não entram no total.

## Colocar no ar (uma vez)

### 1. Supabase (login e banco)

1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor → New query**: cole `supabase/schema.sql` inteiro e clique em **Run**.
3. **Authentication → Sign In / Providers → Email**: desligue **"Allow new users to sign up"**. Só entra quem a equipe liberar.
4. **Authentication → URL Configuration**:
   - *Site URL*: o endereço do app (ex.: `https://concierge-soares.vercel.app`).
   - *Redirect URLs*: adicione `https://SEU-ENDERECO/auth/callback` e `https://SEU-ENDERECO/auth/confirm`.
5. (Recomendado) **Authentication → Email Templates → Magic Link**: troque o link por
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
   Assim o cliente pode abrir o e-mail em outro aparelho (celular, por exemplo).
6. **Crie os logins da equipe**: em **Authentication → Users → Add user**, informe e-mail e senha de cada pessoa da equipe. Depois, no SQL Editor:
   ```sql
   update public.perfis set papel = 'equipe', nome = 'Rafhaela'
   where user_id = (select id from auth.users where email = 'email-da-rafhaela@exemplo.com');
   ```
   Todo login novo nasce como **cliente** (o papel mais restrito); só esse comando transforma alguém em equipe.
7. **Project Settings → API**: copie *Project URL*, *anon public key* e *service_role key*.
8. (Para produção) **Authentication → Emails → SMTP**: configure um envio próprio (ex.: Resend). O envio padrão do Supabase tem limite baixo por hora.

### 2. SerpApi (pesquisas reais)

Crie a conta em <https://serpapi.com> e copie a chave. Cada busca gasta 1 crédito; buscas idênticas em até 20 minutos usam o cache. Sem a chave, o app funciona com **DADOS DE EXEMPLO** (marcados em vermelho e bloqueados para ir à viagem).

### 3. Vercel (publicar)

1. **Add New → Project** e escolha o repositório `concierge-app`.
2. Em **Root Directory**, escolha **`web`** (o app fica nesta pasta).
3. **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**segredo**; usado só para liberar o acesso de clientes) |
| `NEXT_PUBLIC_APP_URL` | o endereço do app |
| `SERPAPI_KEY` | chave da SerpApi |

4. **Deploy**.

## No computador (opcional)

```bash
cd web
npm install
cp .env.example .env.local   # preencha
npm run dev                  # http://localhost:3000
npm run test:rls             # testa as regras de segurança do banco (sem internet)
npm run test:logic           # testa ranking, orçamento e validações
npm run typecheck
```

## Limites conhecidos

- **Ida e volta:** o Google Flights devolve o preço total, mas os horários detalhados são da ida. A descrição do item avisa para confirmar a volta no link.
- **Hospedagem:** os campos do Google Hotels são lidos de forma defensiva e ainda não foram testados com chave real. Se algo vier vazio, aparece "não informado".
- **Milhas brasileiras e Airbnb:** não há API pública. Use o item manual, com o link e a fonte da cotação.
- **Preços mudam:** todo item mostra a fonte e quando foi consultado, e a página do cliente avisa que os valores podem mudar até a reserva.

## Estrutura

```
app/login, app/auth/*         entrada (senha para a equipe, link por e-mail para todos)
app/equipe/*                  área da equipe (acoes.ts = todas as gravações)
app/minhas-viagens/*          área do cliente (somente leitura)
lib/serpapi.ts                único ponto de contato com a SerpApi (voos e hotéis)
lib/ranking.ts                ranking "Melhor" explicável (docs/BUSCADOR.md)
lib/orcamento.ts              soma do orçamento e roteiro por dia
supabase/schema.sql           tabelas, papéis e regras de segurança
scripts/test-rls.ts           teste das regras num Postgres local (PGlite)
```
