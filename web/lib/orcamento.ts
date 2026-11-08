import type { ItemViagem } from "./types";

export interface LinhaOrcamento {
  tipo: string;
  dinheiro: number;
  milhas: number;
  itens: number;
}

export interface Orcamento {
  linhas: LinhaOrcamento[];
  totalDinheiro: number; // preços + taxas de emissões com milhas
  totalMilhas: number;
  considerados: number; // itens recomendados ou reservados com valor
  pendentes: number; // sugestões ainda sem escolha
}

// Soma só o que a consultora recomendou ou reservou: sugestões são alternativas
// e não entram no total (senão duas opções de voo seriam somadas).
export function calcularOrcamento(itens: ItemViagem[]): Orcamento {
  const porTipo = new Map<string, LinhaOrcamento>();
  let considerados = 0;
  let pendentes = 0;
  for (const i of itens) {
    if (i.situacao === "sugestao") {
      if (i.preco !== null || i.milhas !== null) pendentes++;
      continue;
    }
    const dinheiro = (i.preco ?? 0) + (i.milhas ? i.taxas ?? 0 : 0);
    const milhas = i.milhas ?? 0;
    if (!dinheiro && !milhas) continue;
    considerados++;
    const l = porTipo.get(i.tipo) ?? { tipo: i.tipo, dinheiro: 0, milhas: 0, itens: 0 };
    l.dinheiro += dinheiro;
    l.milhas += milhas;
    l.itens++;
    porTipo.set(i.tipo, l);
  }
  const linhas = [...porTipo.values()];
  return {
    linhas,
    totalDinheiro: linhas.reduce((s, l) => s + l.dinheiro, 0),
    totalMilhas: linhas.reduce((s, l) => s + l.milhas, 0),
    considerados,
    pendentes,
  };
}

// Agrupa os itens com data por dia (roteiro), em ordem de data e hora.
export function agruparPorDia(itens: ItemViagem[]): { data: string; itens: ItemViagem[] }[] {
  const dias = new Map<string, ItemViagem[]>();
  for (const i of itens) {
    if (!i.data) continue;
    const lista = dias.get(i.data) ?? [];
    lista.push(i);
    dias.set(i.data, lista);
  }
  return [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, lista]) => ({ data, itens: lista.sort((a, b) => (a.hora ?? "99:99").localeCompare(b.hora ?? "99:99")) }));
}
