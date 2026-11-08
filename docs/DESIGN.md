# Identidade visual do Concierge

Estilo herdado do painel **Soares pelo Mundo** (tokens lidos da tela de entrada em 2026-11-08). Visual editorial e acolhedor: fundo creme, terracota como cor de ação, títulos com serifa e um toque manuscrito.

Layout de referência (6 telas): canvas "Concierge — Layout do App" nos artefatos do Claude.

## Tipografia

| Uso | Fonte | Detalhes |
|-----|-------|----------|
| Títulos | Playfair Display | peso 400, `letter-spacing: -0.5px`; logo em 600 |
| Texto e interface | DM Sans | 16px base; botões 14–15px peso 500 |
| Toque manuscrito | Caveat | subtítulos curtos e logo ("concierge"), nunca em texto longo |
| Rótulos | DM Sans | 11–12px, peso 600, MAIÚSCULAS, `letter-spacing: 1.4–1.6px`, cor `--muted-foreground` |

Google Fonts: `Caveat`, `DM Sans`, `Playfair Display`.

## Cores

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `--background` | `#FAF7F2` | `#14100D` | fundo da página |
| `--card` | `#FFFFFF` | `#1E1813` | cartões e formulários |
| `--foreground` | `#2B2118` | `#F5EFE6` | texto |
| `--ink` | `#1F1712` | `#0E0B09` | painéis escuros (hero, destaques) |
| `--primary` | `#A84C2A` | `#E07042` | botões, links, item ativo |
| `--terracotta` | `#C85A32` | `#E07042` | setas e detalhes |
| `--ochre` | `#C98A2C` | `#E0A84E` | avisos, estrelas |
| `--sage` | `#2D6A4F` | `#4ADE80` | positivo ("por que aqui", milheiro bom) |
| `--muted` / `--sand` | `#F5EFE6` | `#241C16` | barra lateral, chips |
| `--muted-foreground` | `#6E5E52` | `#B5A496` | texto secundário |
| `--accent` | `#F2EBE1` | `#2A211A` | realces suaves |
| `--border` | `#E8DEC8` | `#382C23` | bordas |
| `--input` | `#E3D5C5` | `#3D2E24` | borda de campos |
| `--destructive` | `#B91C1C` | `#F87171` | erros |
| Script sobre escuro | `#F2A27E` | — | Caveat sobre `--ink` |

## Forma

- Raio base `0.75rem` (12px) em campos e botões; cartões 20px; painéis grandes 24px; chips e etiquetas 999px.
- Campos e botões com 46–48px de altura (área de toque ≥ 44px).
- Sombra só no destaque: `0 18px 40px -28px rgba(168,76,42,0.55)` com borda 1,5px `--primary`.
- Fundo da entrada: dois gradientes radiais muito suaves (terracota e ocre a ~10%).

## Padrões de tela

- **Barra lateral** creme (`--sidebar #F5EFE6`) com item ativo em cartão branco; no celular vira barra inferior com 5 itens.
- **Painel escuro** (`--ink`) para hero e mensagens do Concierge, com Caveat em `#F2A27E`.
- **Resultado em destaque** = "Melhor escolha": borda terracota + etiqueta; sempre com a linha "Por que aqui:" em verde-sálvia.
- **Preços** em Playfair 26–28px; detalhes (por pessoa, total, taxas) em 13px abaixo.
