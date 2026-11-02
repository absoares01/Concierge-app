---
name: comparar-hospedagem
description: Compara hotéis, pousadas e aluguéis por temporada em várias fontes e recomenda o bairro e a hospedagem certos para o perfil do viajante. Use para "onde ficar em X", "hotel em Y", "Airbnb em Z" ou quando o planejamento precisar de hospedagem.
---

# Comparar Hospedagem

## 1. Escolha o bairro antes do hotel

O bairro decide metade da viagem. Para cada destino, indique 2 ou 3 bairros com o perfil de cada um (ex.: "central e a pé de tudo", "tranquilo para família", "vida noturna") e escolha um conforme os interesses do viajante.

## 2. Fontes (em paralelo)

| Fonte | Como | Chave |
|-------|------|-------|
| Trivago | MCP `trivago` | Não |
| Airbnb | MCP `airbnb` | Não |
| LiteAPI | MCP `liteapi` | `LITEAPI_API_KEY` |
| Google Hotels | SerpAPI | `SERPAPI_API_KEY` |
| Booking / site do hotel | Navegador | — |

## 3. Saída

| # | Nome | Tipo | Bairro | Nota | R$/noite | Total (R$) | Cancelamento | Fonte |
|---|------|------|--------|------|----------|------------|--------------|-------|

Depois: mais barata, melhor localizada e **melhor custo-benefício**.

## Regras

- Mostre sempre o **total com taxas** (Airbnb tem taxa de limpeza; hotéis em vários países cobram taxa turística na chegada).
- Família com crianças: confira camas, berço e se o quarto comporta todos.
- Se aparecerem redes com programa de pontos (Accor ALL, Marriott Bonvoy, Hilton Honors, IHG, Hyatt), carregue `milhas-e-pontos` e compare a diária em pontos vs dinheiro.
- Cancelamento grátis vale um pequeno extra quando as datas ainda podem mudar: diga isso.
