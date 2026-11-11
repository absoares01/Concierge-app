// Funções puras de datas e viajantes (sem dependência de React ou do servidor).

// "2027-05-12" + 1 → "2027-05-13" (vira mês e ano corretamente)
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

// "2 adultos, 1 criança" → 2. Sem número reconhecível → null.
export function adultosDe(viajantes: string | null): number | null {
  if (!viajantes) return null;
  const m = viajantes.match(/(\d+)\s*adult/i) ?? viajantes.match(/(\d+)/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 9 ? n : null;
}
