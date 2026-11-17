import type { PrecoDia } from "./types";

// Cálculos do calendário de preços de voos (sem banco nem internet).

const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DIAS_SEMANA_LONGO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const pad = (n: number) => String(n).padStart(2, "0");
const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).getUTCDate(); // mes de 1 a 12
const diaDaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

export function nomeMes(chave: string): string {
  const [a, m] = chave.split("-").map(Number);
  return `${NOMES_MES[m - 1]} de ${a}`;
}

export function nomeDiaSemana(i: number): string {
  return DIAS_SEMANA_LONGO[i];
}

// Os próximos 12 meses a partir de hoje ("2026-11", "2026-12", ...).
export function proximosMeses(hoje: string, quantos = 12): { valor: string; rotulo: string }[] {
  let [a, m] = hoje.split("-").map(Number);
  const lista = [];
  for (let i = 0; i < quantos; i++) {
    const valor = `${a}-${pad(m)}`;
    lista.push({ valor, rotulo: nomeMes(valor) });
    m++;
    if (m > 12) {
      m = 1;
      a++;
    }
  }
  return lista;
}

// Período pesquisado: do 1º dia do mês escolhido (ou de amanhã, se o mês já começou)
// até o último dia do último mês. Devolve null se o mês já passou.
export function periodoDe(mes: string, meses: number, hoje: string): { inicio: string; fim: string } | null {
  if (!/^\d{4}-\d{2}$/.test(mes)) return null;
  const [a, m] = mes.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  const amanha = new Date(`${hoje}T12:00:00Z`);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  const amanhaIso = amanha.toISOString().slice(0, 10);
  const primeiro = `${mes}-01`;
  const inicio = primeiro > amanhaIso ? primeiro : amanhaIso;
  const total = m - 1 + Math.min(3, Math.max(1, meses)) - 1;
  const aFim = a + Math.floor(total / 12);
  const mFim = (total % 12) + 1;
  const fim = `${aFim}-${pad(mFim)}-${pad(ultimoDia(aFim, mFim))}`;
  return inicio <= fim ? { inicio, fim } : null;
}

// Meses (AAAA-MM) cobertos pelo período.
export function mesesDoPeriodo(inicio: string, fim: string): string[] {
  const lista: string[] = [];
  let [a, m] = inicio.slice(0, 7).split("-").map(Number);
  const ultimo = fim.slice(0, 7);
  while (`${a}-${pad(m)}` <= ultimo) {
    lista.push(`${a}-${pad(m)}`);
    m++;
    if (m > 12) {
      m = 1;
      a++;
    }
  }
  return lista;
}

// Semanas do mês, começando no domingo; dias fora do mês são null.
export function gradeDoMes(chave: string): (string | null)[][] {
  const [a, m] = chave.split("-").map(Number);
  const dias = ultimoDia(a, m);
  const celulas: (string | null)[] = Array(diaDaSemana(`${chave}-01`)).fill(null);
  for (let d = 1; d <= dias; d++) celulas.push(`${chave}-${pad(d)}`);
  while (celulas.length % 7) celulas.push(null);
  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

// Limites das 5 faixas de cor (quintis). Faixa 1 = 20% mais baratos.
export function faixasDePreco(precos: number[]): number[] {
  const o = [...precos].sort((x, y) => x - y);
  if (o.length === 0) return [];
  const q = (p: number) => o[Math.min(o.length - 1, Math.floor(p * o.length))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

export function faixaDe(preco: number, limites: number[]): 1 | 2 | 3 | 4 | 5 {
  if (limites.length === 0) return 3;
  // Tudo igual: faixa do meio, sem sugerir diferença que não existe.
  if (limites[0] === limites[3]) return 3;
  // Preço igual a um limite fica na faixa de baixo.
  return (1 + limites.filter((l) => preco > l).length) as 1 | 2 | 3 | 4 | 5;
}

export interface Resumo {
  menor: PrecoDia;
  maior: PrecoDia;
  media: number;
  dias: number;
  porDiaSemana: { dia: number; media: number }[]; // só os dias da semana com preço
  porMes: { mes: string; media: number; menor: number; dias: number }[];
}

const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

export function resumoDoCalendario(dias: PrecoDia[]): Resumo | null {
  if (dias.length === 0) return null;
  const ordem = [...dias].sort((a, b) => a.preco - b.preco || a.ida.localeCompare(b.ida));
  const porDia = new Map<number, number[]>();
  const porMes = new Map<string, number[]>();
  for (const d of dias) {
    const s = diaDaSemana(d.ida);
    porDia.set(s, [...(porDia.get(s) ?? []), d.preco]);
    const m = d.ida.slice(0, 7);
    porMes.set(m, [...(porMes.get(m) ?? []), d.preco]);
  }
  return {
    menor: ordem[0],
    maior: ordem[ordem.length - 1],
    media: Math.round(media(dias.map((d) => d.preco))),
    dias: dias.length,
    porDiaSemana: Array.from(porDia, ([dia, v]) => ({ dia, media: Math.round(media(v)) })).sort((a, b) => a.media - b.media),
    porMes: Array.from(porMes, ([mes, v]) => ({ mes, media: Math.round(media(v)), menor: Math.min(...v), dias: v.length })).sort((a, b) => a.mes.localeCompare(b.mes)),
  };
}

// Preço curto para caber na célula: "980", "3,2 mil", "12 mil".
export function precoCelula(v: number): string {
  if (v < 1000) return String(Math.round(v));
  if (v < 10000) return `${(v / 1000).toFixed(1).replace(".", ",").replace(",0", "")} mil`;
  return `${Math.round(v / 1000)} mil`;
}
