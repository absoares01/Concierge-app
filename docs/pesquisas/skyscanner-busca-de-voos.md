# Pesquisa: busca de voos — Skyscanner
Data: 2026-11-01 · Versão analisada: documentação pública (API de parceiros v3) e páginas oficiais de ajuda · Ferramenta REA: não usada

> **Método.** O REA não estava conectado nesta sessão, e a documentação oficial do Skyscanner já explica o funcionamento técnico da busca. Isso é preferível a inspecionar o app: é público, preciso e sem risco legal. Nada foi descompilado nem acessado por API privada.

## O que o usuário vê

- Formulário: origem, destino (inclusive "Qualquer lugar"), datas (inclusive "Mês inteiro" e "Mês mais barato"), passageiros, classe, aeroportos próximos e "só voos diretos".
- Resultados aparecem rápido e vão sendo completados enquanto a busca continua.
- Abas de ordenação: **Melhor** (padrão), **Mais barato**, **Mais rápido**.
- Filtros: escalas, horários, companhias, duração, aeroportos e impacto ambiental.
- Cada voo mostra vários vendedores (companhia e agências) com preços diferentes; o clique leva ao site do vendedor para comprar.
- Alertas de preço por e-mail ou notificação.

## Como funciona (evidências observadas na documentação oficial)

**1. Busca em duas etapas: criar → consultar (create/poll)**
- `POST .../flights/live/search/create` recebe mercado, idioma, moeda, trechos e passageiros. Devolve **logo** um subconjunto de resultados vindos do cache e um `sessionToken`.
- `POST .../flights/live/search/poll/{sessionToken}` devolve a lista completa, que demora mais porque consulta os parceiros (companhias e agências) em tempo real.
- O token vale cerca de uma hora; depois disso é preciso criar outra busca.
- O campo de ação indica quando a lista anterior deve ser **substituída** pela nova.

**2. Modelo de dados normalizado**
- `itineraries` (opções compráveis) → `legs` (ida, volta) → `segments` (cada voo físico, com número do voo e companhia).
- Entidades separadas e referenciadas por ID: `places`, `carriers`, `agents` (vendedores).
- Cada itinerário tem `pricingOptions`: uma lista de ofertas, cada uma com preço, vendedores e `deepLink` para compra. **Um mesmo voo, vários preços.**
- `stats` com preço mínimo, durações mínima e máxima e contagem de escalas: base para montar os filtros sem varrer a lista.

**3. Ordenação com pontuação**
- `sortingOptions` traz três listas, `best`, `cheapest` e `fastest`, cada uma com `itineraryId` e um `score`.
- Segundo a página oficial "como o Skyscanner funciona", **Melhor** busca o equilíbrio entre preço e conveniência. Pesa preço, tempo total com conexões, voo direto ou não, companhia, horários, critérios da busca e país de origem. Os pesos variam dinamicamente e empates são ordenados ao acaso.
- A página de confiabilidade acrescenta que entram também o número de escalas e o "incômodo" da viagem, como troca de aeroporto e conexões longas.
- Links patrocinados e anúncios ficam **fora** do ranking.

**4. Frescor dos preços**
- Os preços ficam em cache por **10 minutos**.
- Antes da compra existe o "refresh" de um itinerário específico, que busca o preço atualizado no parceiro.
- A própria empresa avisa que o preço pode mudar até a confirmação: tarifas dinâmicas, bagagem, assento e taxas de pagamento.

**5. Busca flexível**
- "Mês inteiro" mostra o menor preço por dia com base em preços vistos nos últimos dias.
- "Qualquer lugar" mostra os destinos mais baratos para as datas.
- Ambos usam **preços indicativos** (do cache), não preços ao vivo.

**6. Modelo de negócio**
- É metabusca: não vende passagens. Recebe comissão ou taxa por indicação do vendedor, além de anúncios.

## O que é inferido (não confirmado)

- A fórmula exata e os pesos do "Melhor" não são públicos; só os fatores.
- O significado e a faixa do `score` não estão documentados.
- Detalhes de cache (além dos 10 min do refresh) não são divulgados.

## O que NÃO vamos copiar e por quê

- Nada de código, textos, ícones ou layout do Skyscanner.
- Não usaremos a API do Skyscanner sem contrato: o acesso é para parceiros aprovados.
- Não vamos esconder a fórmula do ranking. O nosso "Melhor" será **explicável** ("Por que este é o melhor?").

## Nossa versão para o Concierge

- **Fonte de dados oficial:** Kiwi (MCP), Duffel (API com busca em lotes, que segue o mesmo padrão criar → consultar), Google Flights via SerpAPI para datas flexíveis, Seats.aero para milhas.
- **Regras de negócio:** busca criar → consultar com resultados progressivos; um voo com vários preços/vendedores; ranking Melhor/Mais barato/Mais rápido + **Milhas**; cache de 10 min e reconfirmação antes de comprar.
- **Telas/componentes:** formulário, lista progressiva, abas de ordenação, filtros calculados a partir das estatísticas, detalhe do voo com lista de vendedores.
- **Diferencial:** voos por milhas na mesma lista, comparados pelo custo efetivo em R$; custo real com bagagem; explicação do ranking.

Projeto completo: [`docs/BUSCADOR.md`](../BUSCADOR.md).

## Riscos e pendências

- Sem acesso à API do Skyscanner, a cobertura de vendedores será menor no começo.
- Confirmar com as fontes (Kiwi, Duffel) os campos exatos de bagagem e regras tarifárias.

## Fontes

- [Flights Live Prices — visão geral](https://developers.skyscanner.net/docs/flights-live-prices/overview)
- [Flights Live Prices — referência da API](https://developers.skyscanner.net/api/flights-live-pricing)
- [Refresh Prices](https://developers.skyscanner.net/docs/flights-live-prices/refresh-prices)
- [How Skyscanner works](https://www.skyscanner.net/media/how-skyscanner-works)
- [Is Skyscanner reliable?](https://www.skyscanner.com/flights/advice/is-skyscanner-reliable)
- [How to find flight deals](https://www.skyscanner.com/tips-and-inspiration/how-to-find-flight-deals)
