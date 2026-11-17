import { iata } from "./validar";
import type { BuscaVoos } from "./types";

// Leitura da busca de voos a partir do endereço (?origem=GRU&destino=LIS&ida=...).
// Fica fora da página para ser usada também na lista de sites e nos testes.

export type Params = Record<string, string | undefined>;

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function lerBusca(p: Params): BuscaVoos | null {
  const origem = iata(p.origem ?? null);
  const destino = iata(p.destino ?? null);
  const ida = p.ida && DATA.test(p.ida) ? p.ida : null;
  if (!origem || !destino || !ida) return null;
  const volta = p.volta && DATA.test(p.volta) ? p.volta : undefined;
  const adultos = Math.min(9, Math.max(1, Number(p.adultos) || 1));
  const classe = ([1, 2, 3, 4] as const).find((c) => String(c) === p.classe) ?? 1;
  return { origem, destino, ida, volta, adultos, classe, soDiretos: p.diretos === "on" };
}

// Parâmetros da busca de volta para o endereço (para links entre as telas).
export function paramsDaBusca(q: BuscaVoos, extra: Params = {}): string {
  const s = new URLSearchParams({ origem: q.origem, destino: q.destino, ida: q.ida, adultos: String(q.adultos), classe: String(q.classe) });
  if (q.volta) s.set("volta", q.volta);
  if (q.soDiretos) s.set("diretos", "on");
  for (const [k, v] of Object.entries(extra)) if (v) s.set(k, v);
  return s.toString();
}

const CABINE = { 1: "economy", 2: "premiumeconomy", 3: "business", 4: "first" } as const;

// Mesma busca no Skyscanner, para comparar agências que o Google não lista.
// Só um link: nada é lido nem copiado do Skyscanner.
// Com vários aeroportos (GRU,VCP), usa o primeiro de cada lado.
export function linkSkyscanner(q: BuscaVoos): string {
  const aammdd = (d: string) => d.slice(2).replace(/-/g, "");
  const o = q.origem.split(",")[0].toLowerCase();
  const d = q.destino.split(",")[0].toLowerCase();
  const caminho = [o, d, aammdd(q.ida), q.volta ? aammdd(q.volta) : null].filter(Boolean).join("/");
  const s = new URLSearchParams({ adultsv2: String(q.adultos), cabinclass: CABINE[q.classe], rtn: q.volta ? "1" : "0" });
  if (q.soDiretos) s.set("preferdirects", "true");
  return `https://www.skyscanner.com.br/transport/flights/${caminho}/?${s.toString()}`;
}
