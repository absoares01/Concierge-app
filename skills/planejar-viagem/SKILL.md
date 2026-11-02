---
name: planejar-viagem
description: Fluxo guiado de planejamento completo de viagem. Pergunta destino, datas, viajantes, orçamento e interesses, depois busca voos e hospedagem em paralelo, calcula custos (dinheiro vs milhas) e entrega roteiro e plano de reservas. Use quando a pessoa disser "planeje uma viagem", "monte minha viagem" ou pedir o pacote completo.
---

# Planejar Viagem (comando principal)

Entrega um plano de viagem completo, opinativo e com números.

## 1. Coletar o perfil (uma pergunta por vez, só o que faltar)

1. **Para onde?** Cidade, país ou região ("Patagônia", "Norte de Portugal").
2. **Quando?** Datas exatas ou janela ("qualquer semana de maio"). Flexibilidade muda muito o preço.
3. **Quem vai?** Adultos, crianças (idades), necessidades especiais.
4. **Orçamento e estilo?** Econômico / conforto / luxo, ou um teto em R$.
5. **Milhas ou dinheiro?** "Melhor dos dois" (padrão), "só milhas" ou "só dinheiro".
6. **Interesses?** Gastronomia, natureza, cultura, compras, descanso, vida noturna.

Depois da última resposta, resuma o pedido em uma frase e comece.

## 2. Fluxo

1. Carregue `licoes-aprendidas` (obrigatório).
2. **Voos** → `comparar-voos` (Kiwi + Skiplagged sempre; Duffel/SerpAPI se houver chave).
3. **Milhas** → se a pessoa tem pontos, `milhas-e-pontos` para checar emissões e calcular o valor do milheiro.
4. **Hospedagem** → `comparar-hospedagem` no bairro certo para o perfil.
5. **Documentos** → `documentos-e-requisitos` se for internacional.
6. **Roteiro** → `roteiro-dia-a-dia` com a lógica geográfica dos bairros/atrações.
7. **Orçamento** → some tudo na tabela abaixo.

## 3. Saída

### Resumo
Uma frase com a recomendação vencedora e o custo total.

### Voos
Tabela ranqueada (3 a 5 linhas), vencedora em **negrito**.

### Hospedagem
Tabela ranqueada, com bairro e motivo.

### Orçamento estimado (por pessoa e total)

| Item | Dinheiro (R$) | Com milhas | Observação |
|------|---------------|------------|------------|
| Voos | | | |
| Hospedagem | | | |
| Transporte local | | | |
| Alimentação (estimativa/dia) | | | |
| Passeios e ingressos | | | |
| Seguro viagem | | | |
| **Total** | | | |

### Roteiro resumido
Um parágrafo ou tabela por dia (detalhe completo via `roteiro-dia-a-dia`).

### Plano de reservas
Ordem certa: o que reservar primeiro (o que esgota ou encarece), prazos de cancelamento, e quando transferir pontos (nunca antes de confirmar a disponibilidade).

### Próximos passos
Frases afirmativas, não perguntas.

## Não faça

- Despejar 12 opções. Escolha e justifique.
- Inventar preços. Estimativas sempre marcadas como "estimativa".
- Transferir pontos ou reservar sem confirmação explícita.
