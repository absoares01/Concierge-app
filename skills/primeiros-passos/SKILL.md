---
name: primeiros-passos
description: Verifica quais chaves de API estão configuradas e explica o que cada uma libera. Use quando a pessoa instalar o Concierge, perguntar "o que está funcionando?" ou uma busca falhar por falta de chave.
disable-model-invocation: true
---

# Primeiros Passos

Rode no terminal (sem mostrar os valores das chaves, só se existem):

```bash
for k in ANTHROPIC_API_KEY LITEAPI_API_KEY DUFFEL_API_KEY SERPAPI_API_KEY SEATS_AERO_API_KEY; do
  if [ -n "${!k}" ]; then echo "✅ $k"; else echo "—  $k"; fi
done
```

Depois explique em uma tabela:

| Chave | Libera | Sem ela |
|-------|--------|---------|
| (nenhuma) | Voos via Kiwi/Skiplagged, hotéis via Trivago/Airbnb, balsas via Ferryhopper | — |
| `LITEAPI_API_KEY` | Tarifas de hotel ao vivo | Trivago e Airbnb cobrem a descoberta |
| `DUFFEL_API_KEY` | Preços reais por classe tarifária | Preços dos agregadores (menos precisos) |
| `SERPAPI_API_KEY` | Google Flights e Google Hotels | Menos opções de comparação |
| `SEATS_AERO_API_KEY` | Disponibilidade de emissões com milhas em vários programas | Consulta manual nos sites dos programas |

Nunca peça para a pessoa colar chaves no chat: oriente a colocá-las no arquivo `.env` (veja `.env.example`).
