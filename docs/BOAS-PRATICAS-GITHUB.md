# Boas práticas no GitHub (e nos serviços usados pelo app)

A conta do GitHub já foi suspensa uma vez por suspeita de violar os termos. Estas regras valem para qualquer pessoa ou agente (inclusive o Claude) que trabalhe nos repositórios da Soares pelo Mundo.

Referência: [Políticas de uso aceitável do GitHub](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies).

## O que o GitHub proíbe e mais nos afeta

- **Atividade automatizada em massa:** muitos commits, PRs, issues, estrelas ou chamadas de API em pouco tempo ("automated excessive bulk activity").
- **Atividade inautêntica e falsa identidade:** contas falsas, ou se passar por outra pessoa ou projeto.
- **Malware e programas executáveis** distribuídos pelo repositório.
- **Uso excessivo de banda ou de armazenamento** de arquivos.

## Regras deste projeto

1. **Nunca reenviar cópias de projetos de terceiros.** Para estudar ou usar um projeto de outra pessoa, use o botão **Fork** (que mostra a origem) ou instale o pacote oficial (npm, pip). Não suba uma cópia com o mesmo nome e o mesmo README: esse é o padrão usado para espalhar malware se passando por projetos conhecidos.
2. **Nenhum segredo no repositório.** Chaves (Supabase, SerpApi, Anthropic) ficam só na Vercel ou em `.env.local`, que o Git ignora.
3. **Nenhum executável ou arquivo grande.** Código-fonte e dados pequenos apenas. Arquivos acima de alguns MB vão para um armazenamento próprio (Supabase Storage).
4. **Commits poucos e com sentido.** Agrupe as mudanças. Agentes não fazem laços de commits, PRs ou chamadas de API, e não estrelam, seguem ou abrem issues em repositórios de terceiros.
5. **Mesclagem com revisão humana.** PRs são aprovados por uma pessoa da equipe antes de irem para a `main`.
6. **Créditos e licenças.** Código ou dados de terceiros entram só com licença compatível e com o aviso em `THIRD_PARTY_NOTICES.md`.
7. **Nada de raspagem que viole termos de terceiros** hospedada no repositório. Dados de voos e hotéis vêm de APIs licenciadas (SerpApi, Duffel, LiteAPI). Para Airbnb e programas de milhas, use cotação manual.
8. **Repositórios privados por padrão** para código do negócio.

## Antes de cada envio (checklist)

- [ ] `git status` sem `.env`, chaves ou arquivos grandes
- [ ] Testes passando (`npm run typecheck`, `npm run test:logic`, `npm run test:rls`)
- [ ] Mudança agrupada em poucos commits com mensagem clara
- [ ] Nenhuma ação automática em repositórios de outras pessoas
