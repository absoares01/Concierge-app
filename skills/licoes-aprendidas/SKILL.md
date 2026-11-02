---
name: licoes-aprendidas
description: Referência obrigatória antes de qualquer busca de voos ou emissão com milhas. Hierarquia de confiança das fontes, armadilhas comuns e erros já cometidos. Adicione aqui cada erro novo descoberto em uso real.
---

# Lições Aprendidas

Conhecimento acumulado de buscas reais. Atualize este arquivo sempre que um erro for descoberto.

## Hierarquia de confiança dos preços

**Site da companhia / Duffel > Google Flights (SerpAPI) > Kiwi / Skiplagged**

- Agregadores servem para descobrir rotas e datas; o preço final é o do site oficial no momento da compra.
- Google Flights costuma mostrar tarifas com bagagem incluída ou "pacotes": não compare direto com tarifa básica.
- Kiwi traz resultados ruins em rotas pequenas/regionais: filtre ou pule.

## Arquivos de dados são cache

Paridades de transferência, bônus, tabelas de emissão e requisitos de entrada mudam. Se o viajante disser que algo funciona e o arquivo discorda, **verifique no site oficial primeiro** e atualize o arquivo.

## Armadilhas frequentes

- Comparar milhas sem incluir as taxas da emissão.
- Recomendar transferência de pontos antes de confirmar a disponibilidade (transferência é irreversível).
- Esquecer bagagem despachada na comparação de tarifas.
- Conexão em bilhetes separados sem margem de tempo.
- Ignorar aeroportos alternativos na origem (CGH/VCP além de GRU) e no destino.
- Fuso horário e "chegada no dia seguinte" em voos noturnos: confira a data do check-in do hotel.

## Limites das fontes

- **Seats.aero não cobre os programas brasileiros.** Não tem LATAM Pass direto (voos LATAM só aparecem via programas parceiros) e não lista Smiles nem Azul Fidelidade. Para eles, consulte o site do programa ou peça a cotação ao viajante.
- **Chave Pro do Seats.aero é só para uso pessoal** (1.000 chamadas/dia, só cache). Uso comercial exige aprovação.
- **O MCP do Airbnb é comunitário**, não oficial: use com moderação e nunca com `--ignore-robots-txt`.
- **Metabuscadores podem destacar quem paga mais**, não o mais barato (caso Trivago na Austrália). Compare sempre o preço total de todas as ofertas, não só a destacada.

## Registro de casos

<!-- Adicione: data — situação — o que deu errado — regra nova -->
