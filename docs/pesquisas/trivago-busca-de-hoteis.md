# Pesquisa: busca de hotéis — Trivago
Data: 2026-11-01 · Versão analisada: páginas públicas, decisão judicial australiana (ACCC v Trivago) e documentação do MCP · Ferramenta REA: não usada

> **Método.** Pesquisa por fontes públicas: imprensa especializada, a decisão da Justiça australiana (que descreveu o algoritmo com base em perícia) e a descrição do servidor MCP oficial do Trivago. Nada foi descompilado nem acessado por API privada.

## O que o usuário vê

- Busca por cidade, região ou hotel, com datas e hóspedes.
- Lista de hotéis, cada um com **um preço em destaque** e outros preços de sites diferentes (Booking, Expedia, site do hotel etc.).
- Filtros: preço, estrelas, nota, comodidades, tipo de hospedagem e distância.
- Mapa, fotos, nota agregada de avaliações.
- O clique leva ao site parceiro, onde a reserva é feita.

## Como funciona (evidências observadas)

**1. Metabusca de preços**
- O Trivago compara tarifas publicadas por hotéis e sites de reserva. Não vende diárias: o anunciante paga por clique (CPC).

**2. Ranking e oferta em destaque influenciados pelo lance**
- Hotéis e sites participam de um **leilão de CPC** que afeta a posição. Segundo a PhocusWire, o modelo mudou de "o preço mais baixo vence" para "o lance vence".
- A Justiça australiana concluiu (2020, mantido em recurso) que o algoritmo **não era guiado principalmente pelo preço**: o valor do CPC tinha grande peso, e o perito do próprio Trivago o colocou como segundo fator mais importante.
- Em **66,8%** das listagens, a oferta em destaque **não era a mais barata**.
- Ofertas com lance abaixo de um mínimo nem apareciam, então a tarifa mais barata às vezes ficava oculta.
- Os preços riscados comparavam, muitas vezes, quarto padrão com quarto de luxo do mesmo hotel.
- Resultado: multa de AUD 44,7 milhões em 2022.

**3. Servidor MCP oficial**
- `trivago-accommodation-search`: busca por cidade/região e datas.
- `trivago-accommodation-radius-search`: busca ao redor de coordenadas (ex.: perto de um ponto turístico).
- `trivago-search-suggestions`: sugestões de destino.
- Retorna hotéis com preços de vários sites, fotos, detalhes e link para a página da hospedagem.

## O que é inferido (não confirmado)

- Os pesos atuais do ranking (após a decisão judicial) não são públicos.
- Parâmetros exatos das ferramentas do MCP: conferir em `mcp.trivago.com/docs` antes de implementar.

## O que NÃO vamos copiar e por quê

- **Ranking pago.** No Concierge, comissão de parceiro nunca altera posição nem a oferta em destaque. Isso é o centro da proposta de valor de um concierge (e, no Brasil, o Código de Defesa do Consumidor também exige informação clara e não enganosa).
- **Preço riscado enganoso.** Só mostraremos comparação entre o **mesmo tipo de quarto**, nas mesmas condições.
- Nada de código, textos ou layout do Trivago.

## Nossa versão para o Concierge

- **Fonte de dados oficial:** Trivago (MCP) para descoberta e preços por site; LiteAPI para tarifas ao vivo e reserva; Airbnb (MCP, apenas protótipo) para aluguel por temporada.
- **Regras de negócio:** preço total da estadia com taxas como valor principal; oferta em destaque = a mais barata comparável; ranking explicável por preço, nota, localização e cancelamento; hotéis e Airbnb na mesma lista.
- **Telas/componentes:** lista + mapa, filtros (tipo, preço, nota, bairro, cancelamento grátis), detalhe com todos os preços por site.
- **Diferencial:** imparcialidade declarada; bairro recomendado pelo perfil do viajante; comparação com diária em pontos de hotel.

Projeto completo: [`docs/BUSCADOR.md`](../BUSCADOR.md).

## Riscos e pendências

- O MCP do Airbnb não é oficial (raspa o site público). Ver o projeto do buscador.
- Confirmar os termos de uso comercial do MCP do Trivago.

## Fontes

- [Trivago — Wikipédia](https://en.wikipedia.org/wiki/Trivago)
- [PhocusWire — o modelo de metabusca do Trivago](https://www.phocuswire.com/Trivago-metasearch-model)
- [ACCC — Trivago perde recurso](https://www.accc.gov.au/media-release/trivago-loses-appeal-after-misleading-consumers-over-hotel-ads)
- [SCL — The Deceptive Algorithm in Court](https://www.scl.org/10802-the-deceptive-algorithm-in-court-australian-competition-and-consumer-commission-v-trivago-n-v-2020-fca-16/)
- [Trivago MCP Connector](https://skillsplayground.com/connectors/trivago/)
