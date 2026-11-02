---
name: pesquisar-apps-de-viagem
description: Estuda como uma funcionalidade de um app de viagem existente funciona (busca de voos, filtros, linha do tempo de roteiro, alerta de preço, mapa, chat) usando o REA (Reverse Engineer Anything) e projeta uma versão própria para o Concierge. Use quando o desenvolvedor disser "quero algo como o X do app Y", "como o app Z faz isso?" ou pedir benchmarking técnico de concorrentes. Ferramenta de desenvolvimento, não de atendimento ao viajante.
---

# Pesquisar Apps de Viagem com o REA

O **REA** (Reverse Engineer Anything) é um servidor MCP + CLI que inspeciona aplicativos sem o código-fonte: apps JavaScript/Electron, sites, APKs Android, binários nativos e .NET. Ele explica *como* uma funcionalidade funciona, com evidências e limitações, para que a gente construa a **nossa própria versão**.

Esta skill é para **desenvolver o Concierge**, não para atender viajantes. Ela fica em `.claude/skills/` (só para quem trabalha no repositório) e não faz parte do plugin distribuído.

## 1. Instalação (fonte oficial)

Instale sempre a partir do projeto oficial [morluto/rea](https://github.com/morluto/rea), do site [rea.tools](https://rea.tools/) ou do pacote npm `rea-agents`. O repositório `absoares01/REA` é uma cópia de referência para estudo; o próprio REA avisa que cópias não garantem um download oficial.

**Opção A — plugin do Claude Code** (traz a skill oficial e registra o servidor `rea`):

```
/plugin marketplace add morluto/rea
/plugin install rea@rea
```

**Opção B — instalador** (Claude Code, Codex, Cursor, Gemini CLI e outros):

```bash
npx rea-agents setup     # rode fora da pasta do projeto analisado
```

Depois reinicie o agente. Requer Node.js 22+. Análise de sites e de apps JavaScript não precisa de motor nativo; binários nativos usam Ghidra, Hopper, IDA ou Kuna já instalados.

**Sem MCP** (análise estática de um app JavaScript/Electron já extraído):

```bash
npx -y rea-agents@latest analyze-javascript-application /caminho/absoluto/do/app --json
```

## 2. Limites (leia antes de cada pesquisa)

O REA é feito para análise **legal**: interoperabilidade, auditoria do próprio software, pesquisa e educação. No Concierge, usamos para **entender ideias e padrões**, nunca para copiar.

**Pode:**
- Entender o *fluxo* e a *lógica* de uma funcionalidade (quais etapas, que dados usa, como reage a filtros) para reescrever do zero.
- Analisar o **nosso próprio** app (builds do Concierge, bundles de produção) para depurar e otimizar.
- Observar páginas públicas no **seu** navegador, como um usuário comum.
- Gerar um ambiente de testes (AgentEnv) do **nosso** app para testar o Concierge automaticamente.

**Não pode:**
- Copiar código, textos, ícones ou imagens de outro app (direitos autorais).
- Extrair chaves de API, tokens ou credenciais embutidas em apps de terceiros.
- Usar APIs privadas/internas de companhias aéreas, OTAs ou programas de milhas descobertas por engenharia reversa (viola os termos de uso e pode ser crime). Para dados, use APIs oficiais e parceiros (Kiwi, Duffel, LiteAPI, Trivago, SerpAPI, Seats.aero).
- Contornar login, captcha, proteção anti-bot, DRM ou verificação de licença.
- Rodar contra contas, dispositivos ou sistemas de terceiros sem autorização.

Na dúvida, confira os termos de uso do app analisado e as leis aplicáveis (no Brasil, Lei de Software 9.609/98 e LGPD para dados pessoais). Se a análise exigir algo da lista "não pode", **pare e avise o desenvolvedor**.

## 3. Escolha a ferramenta pelo tipo de alvo

| Alvo | Ferramenta REA | Exemplo no Concierge |
|------|----------------|----------------------|
| Site/página aberta no seu navegador | `list_browser_targets` | Ver como um buscador público monta a tela de resultados |
| Ações no navegador (clicar, digitar) | `capture_browser_scenario` | Registrar o fluxo "buscar voo → filtrar → ordenar" do nosso app |
| App Electron/JavaScript (ASAR ou pasta) | `analyze_javascript_application` | Estudar um app desktop de planejamento de viagem |
| APK Android | `inspect_android_package` | Entender a estrutura de telas de um app móvel |
| ZIP/APK/IPA/DMG (inventário) | `open_binary` + `inspect_artifact` | Ver bibliotecas e recursos usados |
| Captura HAR já salva | `inspect_web_network_capture` | Analisar a performance do **nosso** front-end |
| Ambiente de agente do nosso app | `capture_browser_scenario` + `export_environment_bundle` | Criar testes automáticos do Concierge |

Use a lista real de ferramentas do servidor conectado: versões diferentes do REA podem ter ferramentas diferentes.

## 4. Fluxo

1. **Defina a pergunta.** Uma funcionalidade por vez: "Como o app X agrupa os voos por 'melhor opção'?" e não "copie o app X".
2. **Confira os limites** da seção 2 para esse alvo.
3. **Rode o REA** com a ferramenta da seção 3. Comece com `detail: "summary"` em alvos grandes.
4. **Leia as evidências e as limitações.** O REA separa o que foi *observado* do que foi *inferido*. Não trate inferência como fato.
5. **Escreva a especificação própria** em `docs/pesquisas/<funcionalidade>.md` (modelo abaixo).
6. **Implemente do zero** no Concierge, com nossas fontes de dados oficiais e nosso design.

## 5. Modelo de saída (`docs/pesquisas/<funcionalidade>.md`)

```markdown
# Pesquisa: <funcionalidade> — <app de referência>
Data: AAAA-MM-DD · Versão analisada: <versão> · Ferramenta REA: <ferramenta>

## O que o usuário vê
## Como funciona (evidências observadas)
## O que é inferido (não confirmado)
## O que NÃO vamos copiar e por quê
## Nossa versão para o Concierge
- Fonte de dados oficial:
- Regras de negócio:
- Telas/componentes:
- Diferencial em relação à referência:
## Riscos e pendências
```

## Ideias de pesquisa para o Concierge

- Ranking "melhor custo-benefício" em buscadores de voo (pesos de preço × duração × escalas).
- Linha do tempo de viagem e reorganização de roteiro arrastando itens.
- Alertas de queda de preço (frequência, gatilhos, texto da notificação).
- Fluxo de onboarding que coleta o perfil do viajante com poucas perguntas.
- Chat de concierge com cartões ricos (voo, hotel, mapa) no meio da conversa.
