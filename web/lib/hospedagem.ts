import { brl } from "./format";
import type { BuscaHospedagem, Hospedagem } from "./types";

export type Params = Record<string, string | undefined>;

export function lerBuscaHospedagem(p: Params): BuscaHospedagem | null {
  const destino = p.destino?.trim().slice(0, 120);
  const ok = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const entrada = ok(p.entrada);
  const saida = ok(p.saida);
  if (!destino || !entrada || !saida || saida <= entrada) return null;
  return { destino, entrada, saida, adultos: Math.min(12, Math.max(1, Number(p.adultos) || 2)), temporada: p.temporada === "on" };
}

const nota = (n: number) => n.toFixed(1).replace(".", ",");

export function descricaoHospedagem(h: Hospedagem, noites: number): string {
  const partes = [
    h.temporada ? "Aluguel por temporada" : h.estrelas ? `Hotel ${h.estrelas} estrelas` : "Hospedagem",
    h.nota !== null ? `nota ${nota(h.nota)} de 5${h.avaliacoes ? ` (${h.avaliacoes} avaliações)` : ""}` : null,
    h.notaLocal !== null ? `Localização: nota ${nota(h.notaLocal)} de 5 no Google` : null,
    h.perto.length ? `Perto: ${h.perto.map((l) => (l.como ? `${l.nome} (${l.como})` : l.nome)).join(", ")}` : null,
    `${noites} ${noites === 1 ? "noite" : "noites"}${h.porNoite ? `, ${brl(h.porNoite)} por noite` : ""}`,
    h.comodidades.length ? `Comodidades: ${h.comodidades.join(", ")}` : null,
    "Confirmar política de cancelamento e taxas no site antes de reservar.",
  ];
  return partes.filter(Boolean).join("\n");
}

// Preço curto para o marcador do mapa: "R$ 980", "R$ 3,2 mil".
export function precoCurto(v: number | null): string {
  if (v === null) return "—";
  if (v < 1000) return `R$ ${Math.round(v)}`;
  if (v < 100000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",").replace(",0", "")} mil`;
  return `R$ ${Math.round(v / 1000)} mil`;
}
