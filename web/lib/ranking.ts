import type { Hospedagem, Ranqueado, Voo } from "./types";
import { brl, duracao, hora } from "./format";

// Ranking "Melhor", explicável e imparcial (docs/BUSCADOR.md, seção 7).
// Cada critério é normalizado entre o melhor (0) e o pior (1) da própria lista.
// Nenhuma comissão ou parceria entra na conta.

function normalizador(valores: number[]) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  return (v: number) => (max === min ? 0 : (v - min) / (max - min));
}

function incomodo(v: Voo): { valor: number; notas: string[] } {
  const notas: string[] = [];
  let valor = 0;
  if (v.trocaAeroporto) {
    valor += 0.4;
    notas.push("troca de aeroporto na conexão");
  }
  if (v.conexaoLongaMin > 360) {
    valor += 0.3;
    notas.push(`conexão longa de ${duracao(v.conexaoLongaMin)}`);
  }
  if (v.conexoes.some((c) => c.duracaoMin > 0 && c.duracaoMin < 60)) {
    valor += 0.3;
    notas.push("conexão com menos de 1 hora");
  }
  const h = Number(hora(v.partida).slice(0, 2));
  if (h >= 0 && h < 5) {
    valor += 0.2;
    notas.push("partida de madrugada");
  }
  return { valor: Math.min(1, valor), notas };
}

export function ranquearVoos(voos: Voo[]): Ranqueado<Voo>[] {
  const comPreco = voos.filter((v) => v.preco !== null);
  if (comPreco.length === 0) return [];
  const nPreco = normalizador(comPreco.map((v) => v.preco!));
  const nTempo = normalizador(comPreco.map((v) => v.duracaoMin));
  const menorPreco = Math.min(...comPreco.map((v) => v.preco!));
  const menorTempo = Math.min(...comPreco.map((v) => v.duracaoMin));

  return comPreco
    .map((v) => {
      const inc = incomodo(v);
      const escalas = v.escalas === 0 ? 0 : v.escalas === 1 ? 0.5 : 1;
      const bagagem = v.bagagem.status === "incluida" ? 0 : v.bagagem.status === "nao_informada" ? 0.5 : 1;
      const soma = 0.5 * nPreco(v.preco!) + 0.25 * nTempo(v.duracaoMin) + 0.1 * escalas + 0.1 * inc.valor + 0.05 * bagagem;
      const nota = Math.round((10 * (1 - soma)) * 10) / 10;

      const motivos: string[] = [];
      if (v.preco === menorPreco) motivos.push("o menor preço da busca");
      else motivos.push(`${brl(v.preco! - menorPreco)} acima do mais barato`);
      if (v.duracaoMin === menorTempo) motivos.push("o mais rápido");
      else motivos.push(`${duracao(v.duracaoMin - menorTempo)} a mais que o mais rápido`);
      motivos.push(v.escalas === 0 ? "voo direto" : `${v.escalas} ${v.escalas === 1 ? "escala" : "escalas"}`);
      if (v.bagagem.status === "incluida") motivos.push("bagagem incluída");
      motivos.push(...inc.notas);
      return { item: v, nota, motivos };
    })
    .sort((a, b) => b.nota - a.nota || a.item.preco! - b.item.preco! || a.item.duracaoMin - b.item.duracaoMin);
}

export function ranquearHospedagem(opcoes: Hospedagem[]): Ranqueado<Hospedagem>[] {
  const comPreco = opcoes.filter((h) => h.total !== null);
  if (comPreco.length === 0) return [];
  const nPreco = normalizador(comPreco.map((h) => h.total!));
  const menor = Math.min(...comPreco.map((h) => h.total!));

  return comPreco
    .map((h) => {
      // Nota do Google (0–5). Poucas avaliações valem menos (puxa para 3,5).
      const peso = h.avaliacoes ? Math.min(1, h.avaliacoes / 100) : 0;
      const notaAjustada = h.nota !== null ? 3.5 + (h.nota - 3.5) * peso : 3.5;
      const critNota = 1 - Math.max(0, Math.min(1, (notaAjustada - 3) / 2));
      const critEstrelas = h.estrelas ? 1 - Math.min(1, (h.estrelas - 1) / 4) : 0.5;
      const soma = 0.55 * nPreco(h.total!) + 0.35 * critNota + 0.1 * critEstrelas;
      const nota = Math.round((10 * (1 - soma)) * 10) / 10;

      const motivos: string[] = [];
      motivos.push(h.total === menor ? "o menor preço total" : `${brl(h.total! - menor)} acima do mais barato`);
      if (h.nota !== null) motivos.push(`nota ${h.nota.toFixed(1).replace(".", ",")} de 5${h.avaliacoes ? ` em ${h.avaliacoes} avaliações` : ""}`);
      else motivos.push("sem nota informada");
      if (h.avaliacoes !== null && h.avaliacoes < 30) motivos.push("poucas avaliações");
      return { item: h, nota, motivos };
    })
    .sort((a, b) => b.nota - a.nota || a.item.total! - b.item.total!);
}
