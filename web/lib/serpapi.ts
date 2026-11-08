import "server-only";
import type { Bagagem, BuscaHospedagem, BuscaVoos, Hospedagem, ResultadoHospedagem, ResultadoVoos, Trecho, Voo } from "./types";
import { diasEntre } from "./format";
import { hospedagensExemplo, voosExemplo } from "./exemplo";

// Único ponto de contato com a SerpApi (https://serpapi.com).
//   Voos:       engine=google_flights (mesma integração do site anterior, já usada com chave real)
//   Hospedagem: engine=google_hotels (inclui aluguel por temporada com vacation_rentals=true)
// Sem SERPAPI_KEY, devolve DADOS DE EXEMPLO, sempre marcados na tela.
// Os campos de google_hotels são lidos de forma defensiva: o que não vier aparece como "não informado".

const ENDPOINT = "https://serpapi.com/search.json";
const CACHE_MS = 20 * 60 * 1000;
const cache = new Map<string, { em: number; valor: unknown }>();

export function temChaveSerpApi(): boolean {
  return Boolean(process.env.SERPAPI_KEY);
}

async function chamar(params: Record<string, string>): Promise<Record<string, unknown>> {
  const chave = JSON.stringify(params);
  const hit = cache.get(chave);
  if (hit && Date.now() - hit.em < CACHE_MS) return hit.valor as Record<string, unknown>;

  const url = new URL(ENDPOINT);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", process.env.SERPAPI_KEY!);
  url.searchParams.set("hl", "pt");
  url.searchParams.set("gl", "br");

  const res = await fetch(url, { cache: "no-store" });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // corpo inválido: tratado abaixo
  }
  const erro = typeof body.error === "string" ? body.error : !res.ok ? `HTTP ${res.status}` : null;
  if (erro) {
    if (/hasn't returned any results|no results/i.test(erro)) return {};
    throw new Error(`SerpApi: ${erro}`);
  }
  cache.set(chave, { em: Date.now(), valor: body });
  return body;
}

// ---------------- Voos ----------------

interface PontoBruto { id?: string; name?: string; time?: string }
interface TrechoBruto {
  departure_airport?: PontoBruto;
  arrival_airport?: PontoBruto;
  duration?: number;
  airline?: string;
  airline_logo?: string;
  flight_number?: string;
  extensions?: string[];
}
interface OpcaoBruta {
  flights?: TrechoBruto[];
  layovers?: { id?: string; duration?: number }[];
  total_duration?: number;
  price?: number;
  airline_logo?: string;
  extensions?: string[];
}

function lerBagagem(extensoes: string[]): { status: Bagagem; texto: string } {
  const linhas = extensoes.filter((e) => /bag|bagagem|mala/i.test(e));
  if (linhas.length === 0) return { status: "nao_informada", texto: "Bagagem não informada pela fonte — confirmar com a companhia." };
  const texto = linhas.join(" · ");
  if (/(no|sem|não).{0,20}(checked|despachada)|checked bag.{0,12}(fee|extra|cobrad)/i.test(texto)) return { status: "nao_incluida", texto };
  if (/(checked|despachada).{0,30}(inclu|free|grát)/i.test(texto) || /1st checked bag included/i.test(texto)) return { status: "incluida", texto };
  return { status: "nao_informada", texto };
}

export function normalizarVoo(b: OpcaoBruta): Voo | null {
  if (!b.flights?.length) return null;
  const trechos: Trecho[] = b.flights.map((s) => ({
    companhia: s.airline ?? "—",
    numero: s.flight_number ?? "",
    de: s.departure_airport?.id ?? "",
    deNome: s.departure_airport?.name ?? "",
    para: s.arrival_airport?.id ?? "",
    paraNome: s.arrival_airport?.name ?? "",
    partida: s.departure_airport?.time ?? "",
    chegada: s.arrival_airport?.time ?? "",
    duracaoMin: s.duration ?? 0,
  }));
  const conexoes = (b.layovers ?? []).map((l) => ({ aeroporto: l.id ?? "", duracaoMin: l.duration ?? 0 }));
  let trocaAeroporto = false;
  for (let i = 0; i < trechos.length - 1; i++) {
    if (trechos[i].para && trechos[i + 1].de && trechos[i].para !== trechos[i + 1].de) trocaAeroporto = true;
  }
  const extensoes = [...(b.extensions ?? []), ...b.flights.flatMap((s) => s.extensions ?? [])];
  const primeiro = trechos[0];
  const ultimo = trechos[trechos.length - 1];
  return {
    id: trechos.map((t) => `${t.numero}@${t.partida}`).join("|"),
    preco: typeof b.price === "number" ? b.price : null,
    companhias: Array.from(new Set(trechos.map((t) => t.companhia).filter((c) => c && c !== "—"))),
    logo: b.airline_logo ?? b.flights[0]?.airline_logo,
    duracaoMin: b.total_duration ?? trechos.reduce((s, t) => s + t.duracaoMin, 0) + conexoes.reduce((s, c) => s + c.duracaoMin, 0),
    escalas: Math.max(0, trechos.length - 1),
    conexoes,
    trechos,
    origem: primeiro.de,
    destino: ultimo.para,
    partida: primeiro.partida,
    chegada: ultimo.chegada,
    trocaAeroporto,
    conexaoLongaMin: conexoes.reduce((m, c) => Math.max(m, c.duracaoMin), 0),
    bagagem: lerBagagem(extensoes),
  };
}

export async function buscarVoos(q: BuscaVoos): Promise<ResultadoVoos> {
  const consultadoEm = new Date().toISOString();
  if (!temChaveSerpApi()) return { voos: voosExemplo(q), exemplo: true, consultadoEm };

  const params: Record<string, string> = {
    engine: "google_flights",
    departure_id: q.origem,
    arrival_id: q.destino,
    outbound_date: q.ida,
    type: q.volta ? "1" : "2",
    currency: "BRL",
    adults: String(q.adultos),
    travel_class: String(q.classe),
  };
  if (q.volta) params.return_date = q.volta;
  if (q.soDiretos) params.stops = "1";

  const body = await chamar(params);
  const brutos = [...((body.best_flights as OpcaoBruta[]) ?? []), ...((body.other_flights as OpcaoBruta[]) ?? [])];
  const voos = brutos.map(normalizarVoo).filter((v): v is Voo => v !== null);
  const pi = body.price_insights as { typical_price_range?: [number, number]; price_level?: string } | undefined;
  const meta = body.search_metadata as { google_flights_url?: string } | undefined;
  return {
    voos,
    exemplo: false,
    consultadoEm,
    linkGoogle: meta?.google_flights_url,
    faixaTipica: pi ? { min: pi.typical_price_range?.[0], max: pi.typical_price_range?.[1], nivel: pi.price_level } : undefined,
  };
}

// ---------------- Hospedagem ----------------

interface PropriedadeBruta {
  type?: string;
  name?: string;
  link?: string;
  property_token?: string;
  gps_coordinates?: { latitude?: number; longitude?: number };
  rate_per_night?: { extracted_lowest?: number };
  total_rate?: { extracted_lowest?: number };
  extracted_hotel_class?: number;
  overall_rating?: number;
  reviews?: number;
  images?: { thumbnail?: string }[];
  amenities?: string[];
  prices?: { source?: string; link?: string; rate_per_night?: { extracted_lowest?: number } }[];
}

export function normalizarHospedagem(p: PropriedadeBruta, noites: number): Hospedagem | null {
  if (!p.name) return null;
  const porNoite = p.rate_per_night?.extracted_lowest ?? null;
  const total = p.total_rate?.extracted_lowest ?? (porNoite !== null ? porNoite * noites : null);
  const tipo = p.type ?? "hotel";
  return {
    id: p.property_token ?? `${p.name}@${p.gps_coordinates?.latitude ?? ""}`,
    nome: p.name,
    tipo,
    temporada: /vacation|rental|temporada/i.test(tipo),
    estrelas: p.extracted_hotel_class ?? null,
    nota: typeof p.overall_rating === "number" ? p.overall_rating : null,
    avaliacoes: typeof p.reviews === "number" ? p.reviews : null,
    porNoite,
    total,
    link: p.link ?? null,
    foto: p.images?.[0]?.thumbnail ?? null,
    lat: p.gps_coordinates?.latitude ?? null,
    lon: p.gps_coordinates?.longitude ?? null,
    ofertas: (p.prices ?? []).map((o) => ({ site: o.source ?? "—", porNoite: o.rate_per_night?.extracted_lowest ?? null, link: o.link ?? null })),
    comodidades: (p.amenities ?? []).slice(0, 8),
  };
}

export async function buscarHospedagem(q: BuscaHospedagem): Promise<ResultadoHospedagem> {
  const consultadoEm = new Date().toISOString();
  const noites = Math.max(1, diasEntre(q.entrada, q.saida));
  if (!temChaveSerpApi()) return { opcoes: hospedagensExemplo(q, noites), exemplo: true, consultadoEm, noites };

  const params: Record<string, string> = {
    engine: "google_hotels",
    q: q.destino,
    check_in_date: q.entrada,
    check_out_date: q.saida,
    adults: String(q.adultos),
    currency: "BRL",
  };
  if (q.temporada) params.vacation_rentals = "true";

  const body = await chamar(params);
  const opcoes = ((body.properties as PropriedadeBruta[]) ?? [])
    .map((p) => normalizarHospedagem(p, noites))
    .filter((h): h is Hospedagem => h !== null);
  return { opcoes, exemplo: false, consultadoEm, noites };
}
