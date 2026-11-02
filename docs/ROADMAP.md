# Roadmap: do "cérebro" ao aplicativo

A ideia, herdada do travel-hacking-toolkit, é separar **o conhecimento** (instruções do agente + skills + dados) **das ferramentas** (servidores MCP e APIs). Isso permite construir o app em fases, reaproveitando tudo.

## Fase 1 — Cérebro do Concierge (este repositório hoje)

Funciona já, dentro do Claude Code, como plugin:

```bash
git clone https://github.com/absoares01/concierge-app.git
cd concierge-app
claude --plugin-dir .
```

Use para testar e refinar com viagens reais (inclusive de clientes da assessoria):
- [ ] Rodar `/concierge:planejar-viagem` em 5 a 10 viagens reais
- [ ] Anotar cada erro em `skills/licoes-aprendidas/SKILL.md`
- [ ] Preencher e datar `data/programas-fidelidade.json`
- [ ] Instalar o REA e usar `pesquisar-apps-de-viagem` para estudar 3 funcionalidades de apps de referência (registrar em `docs/pesquisas/`)
- [ ] Criar skills específicas que fizerem falta (ex.: `transfer-aeroporto`, `restaurantes`, `seguro-viagem`)

## Fase 2 — Backend (API do Concierge)

Um serviço que chama a API do Claude com o mesmo `CLAUDE.md` como system prompt e expõe as fontes como *tools*.

Sugestão de stack:
- **Next.js (App Router) na Vercel** — frontend e rotas de API no mesmo projeto
- **Claude API** (SDK `@anthropic-ai/sdk`) com *tool use*; as skills viram instruções carregadas sob demanda
- **Conector MCP** da própria API para reaproveitar Kiwi, Trivago etc. sem reescrever integrações
- **Supabase** — login, perfis de viajante, viagens salvas, histórico de conversas

O primeiro módulo é o **buscador** de voos e hospedagem: arquitetura, modelo de dados, ranking e etapas em [BUSCADOR.md](BUSCADOR.md).

Modelo de dados inicial:
- `viajantes` (preferências, documentos, programas de fidelidade)
- `viagens` (destino, datas, status: rascunho → planejada → reservada → concluída)
- `itens_viagem` (voo, hospedagem, passeio, transfer; preço, link, prazo de cancelamento)
- `conversas` (mensagens com o Concierge por viagem)

## Fase 3 — Aplicativo

- Chat com o Concierge + painel da viagem (linha do tempo, orçamento, checklist de documentos)
- Alertas: queda de preço, prazo de cancelamento grátis, check-in online, validade do passaporte
- Exportar roteiro em PDF / compartilhar com acompanhantes
- Versão mobile (PWA primeiro; app nativo depois, se fizer sentido)

## Fase 4 — Negócio

- Modo consultor: o assessor revisa e aprova o plano antes de enviar ao cliente
- Planos (gratuito com fontes abertas; pago com milhas, alertas e atendimento humano)
- Integração com reservas reais (afiliados de hotéis/voos)
