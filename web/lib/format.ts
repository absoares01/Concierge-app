const moedaBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat("pt-BR");

export function brl(v: number | null | undefined, moeda = "BRL"): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "não informado";
  if (moeda === "BRL") return moedaBRL.format(v);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda, maximumFractionDigits: 0 }).format(v);
}

export function num(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return numero.format(v);
}

export function duracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${String(m).padStart(2, "0")}min` : `${h}h`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// "2027-05-12" → "12 mai"
export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return iso;
  return `${d} ${MESES[m - 1]}`;
}

// "2027-05-12" → "qua, 12 mai"
export function dataComDia(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS[dia]}, ${d} ${MESES[m - 1]}`;
}

export function periodo(ida: string | null, volta: string | null): string {
  if (!ida) return "Datas a definir";
  if (!volta) return dataCurta(ida);
  return `${dataCurta(ida)} a ${dataCurta(volta)}`;
}

// "2027-05-12 22:05" → "22:05"
export function hora(dt: string): string {
  const m = dt.match(/(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

export function diasEntre(a: string, b: string): number {
  const d1 = Date.parse(a.slice(0, 10) + "T00:00:00Z");
  const d2 = Date.parse(b.slice(0, 10) + "T00:00:00Z");
  return Math.round((d2 - d1) / 86400000);
}

export function quando(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

export const ROTULO_TIPO: Record<string, string> = {
  voo: "Voo",
  hospedagem: "Hospedagem",
  passeio: "Passeio",
  transporte: "Transporte",
  seguro: "Seguro",
  atividade: "Atividade",
  outro: "Outro",
};

export const ROTULO_SITUACAO: Record<string, string> = {
  sugestao: "Sugestão",
  recomendado: "Recomendado",
  reservado: "Reservado",
};

export const ROTULO_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  concluida: "Concluída",
};

export const ROTULO_PACOTE: Record<string, string> = {
  essencial: "Essencial",
  completo: "Completo",
  premium: "Premium",
};
