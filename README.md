# Concierge App

Use IA para criar um serviço de concierge e planejar toda a logística de viagem: voos, hospedagem, roteiro dia a dia, documentos e orçamento, com milhas ou dinheiro.

> "Planeje 10 dias em Portugal em maio para um casal, saindo de São Paulo, gastando até R$ 25 mil."
>
> O Concierge busca voos e hotéis em várias fontes, compara com o uso de milhas, monta o roteiro e entrega o plano de reservas, com números.

## Como funciona

O projeto segue a arquitetura do [travel-hacking-toolkit](https://github.com/borski/travel-hacking-toolkit), adaptada para o viajante brasileiro e ampliada além de voos e milhas:

| Camada | Onde | O que é |
|--------|------|---------|
| Personalidade e regras | `CLAUDE.md`, `agents/concierge.md` | Como o Concierge pensa, pergunta e responde |
| Skills | `skills/*/SKILL.md` | Fluxos especializados carregados sob demanda |
| Ferramentas | `.mcp.json` | Servidores MCP de voos, hotéis, balsas e aluguel |
| Dados | `data/` | Referências (programas de fidelidade, aeroportos) |
| Scripts | `scripts/` | Utilitários (ex.: distância entre aeroportos) |

### Skills

| Skill | Para quê |
|-------|----------|
| `planejar-viagem` | Fluxo guiado completo (o comando principal) |
| `comparar-voos` | Busca paralela e ranking de voos |
| `comparar-hospedagem` | Bairro certo + hotéis, pousadas e Airbnb |
| `milhas-e-pontos` | Smiles, LATAM Pass, Azul Fidelidade, Livelo, Esfera e valor do milheiro |
| `roteiro-dia-a-dia` | Itinerário com horários, deslocamentos e reservas |
| `documentos-e-requisitos` | Passaporte, visto, vacinas, seguro, menores |
| `licoes-aprendidas` | Erros a evitar (cresce com o uso) |
| `primeiros-passos` | Mostra quais chaves de API estão configuradas |

### Fontes de dados

Funcionam **sem nenhuma chave**: Kiwi.com e Skiplagged (voos), Trivago (hotéis), Ferryhopper (balsas), Airbnb.
Opcionais: LiteAPI, Duffel, SerpAPI, Seats.aero (veja `.env.example`).

## Começando (Fase 1)

Requer o [Claude Code](https://docs.claude.com/en/docs/claude-code).

```bash
git clone https://github.com/absoares01/concierge-app.git
cd concierge-app
cp .env.example .env   # opcional: preencha as chaves que tiver
claude --plugin-dir .
```

Dentro do Claude Code:

```
/concierge:planejar-viagem
```

Utilitário de distância:

```bash
python3 scripts/distancia.py GRU LIS MAD GRU
```

## Ferramentas de desenvolvimento

`.claude/skills/` guarda skills para quem desenvolve o Concierge (não vão no plugin):

| Skill | Para quê |
|-------|----------|
| `pesquisar-apps-de-viagem` | Usa o [REA](https://github.com/morluto/rea) para entender como funcionalidades de apps de viagem existentes funcionam e projetar uma versão própria, dentro de limites legais |

## Próximas fases

Do plugin ao aplicativo (backend com a API do Claude, Supabase, app web/mobile): veja [docs/ROADMAP.md](docs/ROADMAP.md).

Projeto do buscador de voos (dinheiro e milhas) e hospedagem (hotéis e Airbnb): veja [docs/BUSCADOR.md](docs/BUSCADOR.md).

Identidade visual (cores, fontes e padrões de tela): veja [docs/DESIGN.md](docs/DESIGN.md).

## Créditos

Inspirado no [travel-hacking-toolkit](https://github.com/borski/travel-hacking-toolkit) de Michael Borohovski (MIT). Detalhes em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
