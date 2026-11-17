import "server-only";
import type { Bagagem, BuscaCalendario, BuscaHospedagem, PrecoDia, ResultadoCalendario, BuscaVoos, Hospedagem, LinkOferta, OfertaVoo, ResultadoHospedagem, ResultadoOfertas, ResultadoVoltas, ResultadoVoos, Trecho, Voo } from "./types";
import { diasEntre } from "./format";
import { calendarioExemplo, hospedagensExemplo, ofertasExemplo, voltasExemplo, voosExemplo } from "./exemplo";

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
  departure_token?: string;
  booking_token?: string;
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
    tokenIda: b.departure_token || undefined,
    tokenReserva: b.booking_token || undefined,
  };
}

function paramsVoos(q: BuscaVoos): Record<string, string> {
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
  return params;
}

function lerVoos(body: Record<string, unknown>): Voo[] {
  const brutos = [...((body.best_flights as OpcaoBruta[]) ?? []), ...((body.other_flights as OpcaoBruta[]) ?? [])];
  return brutos.map(normalizarVoo).filter((v): v is Voo => v !== null);
}

export async function buscarVoos(q: BuscaVoos): Promise<ResultadoVoos> {
  const consultadoEm = new Date().toISOString();
  if (!temChaveSerpApi()) return { voos: voosExemplo(q), exemplo: true, consultadoEm };

  const body = await chamar(paramsVoos(q));
  const pi = body.price_insights as { typical_price_range?: [number, number]; price_level?: string } | undefined;
  const meta = body.search_metadata as { google_flights_url?: string } | undefined;
  return {
    voos: lerVoos(body),
    exemplo: false,
    consultadoEm,
    linkGoogle: meta?.google_flights_url,
    faixaTipica: pi ? { min: pi.typical_price_range?.[0], max: pi.typical_price_range?.[1], nivel: pi.price_level } : undefined,
  };
}

// Ida e volta: depois de escolher a ida, lista as voltas possíveis (1 crédito).
export async function buscarVoltas(q: BuscaVoos, tokenIda: string): Promise<ResultadoVoltas> {
  const consultadoEm = new Date().toISOString();
  if (!temChaveSerpApi()) return { voltas: voltasExemplo(q), exemplo: true, consultadoEm };
  const body = await chamar({ ...paramsVoos(q), departure_token: tokenIda });
  return { voltas: lerVoos(body), exemplo: false, consultadoEm };
}

// ---------------- Sites que vendem o voo (booking options) ----------------

interface PedidoBruto { url?: string; post_data?: string }
interface LadoBruto {
  book_with?: string;
  airline?: boolean;
  airline_logos?: string[];
  price?: number;
  option_title?: string;
  extensions?: string[];
  baggage_prices?: string[];
  booking_request?: PedidoBruto;
  booking_phone?: string;
}
export interface OpcaoReservaBruta {
  separate_tickets?: boolean;
  together?: LadoBruto;
  departing?: LadoBruto;
  returning?: LadoBruto;
}

// Só aceita o endereço de redirecionamento do próprio Google Flights.
function lerPedido(p: PedidoBruto | undefined, rotulo: string): LinkOferta | null {
  if (!p?.url) return null;
  let url: URL;
  try {
    url = new URL(p.url);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "www.google.com") return null;
  const campos = Array.from(new URLSearchParams(p.post_data ?? "").entries());
  return { rotulo, url: url.toString(), campos };
}

const textos = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

export function lerOfertas(lista: OpcaoReservaBruta[]): OfertaVoo[] {
  const ofertas: OfertaVoo[] = [];
  for (const o of lista) {
    if (o.together) {
      const t = o.together;
      if (!t.book_with) continue;
      const link = lerPedido(t.booking_request, "Ir para o site");
      ofertas.push({
        vendedor: t.book_with,
        ehCompanhia: t.airline === true,
        preco: typeof t.price === "number" ? t.price : null,
        tarifa: t.option_title ?? null,
        condicoes: textos(t.extensions),
        bagagem: textos(t.baggage_prices),
        separado: o.separate_tickets === true,
        links: link ? [link] : [],
        telefone: t.booking_phone ?? null,
        logo: t.airline_logos?.[0],
      });
    } else if (o.departing || o.returning) {
      const lados = [o.departing, o.returning].filter((l): l is LadoBruto => Boolean(l?.book_with));
      if (lados.length === 0) continue;
      const precos = lados.map((l) => l.price);
      ofertas.push({
        vendedor: Array.from(new Set(lados.map((l) => l.book_with!))).join(" + "),
        ehCompanhia: lados.every((l) => l.airline === true),
        preco: precos.every((p): p is number => typeof p === "number") ? precos.reduce((a, b) => a + b, 0) : null,
        tarifa: Array.from(new Set(lados.map((l) => l.option_title).filter((x): x is string => Boolean(x)))).join(" / ") || null,
        condicoes: lados.flatMap((l) => textos(l.extensions)),
        bagagem: lados.flatMap((l) => textos(l.baggage_prices)),
        separado: true,
        links: [lerPedido(o.departing?.booking_request, "Comprar a ida"), lerPedido(o.returning?.booking_request, "Comprar a volta")].filter((l): l is LinkOferta => l !== null),
        telefone: lados.find((l) => l.booking_phone)?.booking_phone ?? null,
        logo: lados[0].airline_logos?.[0],
      });
    }
  }
  return ofertas.sort((a, b) => (a.preco ?? Infinity) - (b.preco ?? Infinity));
}

// Lista de companhias e agências que vendem o voo escolhido (1 crédito).
export async function buscarOfertas(q: BuscaVoos, tokenReserva: string): Promise<ResultadoOfertas> {
  const consultadoEm = new Date().toISOString();
  if (!temChaveSerpApi()) return { ...ofertasExemplo(q, tokenReserva), exemplo: true, consultadoEm };
  const body = await chamar({ ...paramsVoos(q), booking_token: tokenReserva });
  const selecionados = ((body.selected_flights as OpcaoBruta[]) ?? []).map(normalizarVoo).filter((v): v is Voo => v !== null);
  const meta = body.search_metadata as { google_flights_url?: string } | undefined;
  return {
    ofertas: lerOfertas((body.booking_options as OpcaoReservaBruta[]) ?? []),
    selecionados,
    exemplo: false,
    consultadoEm,
    linkGoogle: meta?.google_flights_url,
  };
}

// ---------------- Calendário de preços (google_flights_calendar) ----------------
// Uma consulta traz o menor preço de cada dia do período (1 crédito).

interface PrecoBruto { outbound_date?: string; return_date?: string; price?: number; low_price?: boolean }

export function lerCalendario(lista: PrecoBruto[], inicio: string, fim: string): PrecoDia[] {
  const dias = new Map<string, PrecoDia>();
  for (const p of lista) {
    if (!p.outbound_date || !/^\d{4}-\d{2}-\d{2}$/.test(p.outbound_date) || typeof p.price !== "number" || p.price <= 0) continue;
    if (p.outbound_date < inicio || p.outbound_date > fim) continue;
    const atual = dias.get(p.outbound_date);
    if (atual && atual.preco <= p.price) continue;
    dias.set(p.outbound_date, { ida: p.outbound_date, volta: p.return_date ?? null, preco: p.price, baixo: p.low_price === true });
  }
  return Array.from(dias.values()).sort((a, b) => a.ida.localeCompare(b.ida));
}

export async function buscarCalendario(q: BuscaCalendario): Promise<ResultadoCalendario> {
  const consultadoEm = new Date().toISOString();
  if (!temChaveSerpApi()) return { dias: calendarioExemplo(q), exemplo: true, consultadoEm };
  const params: Record<string, string> = {
    engine: "google_flights_calendar",
    departure_id: q.origem,
    arrival_id: q.destino,
    type: q.diasViagem ? "1" : "2",
    date_range_start: q.inicio,
    date_range_end: q.fim,
    currency: "BRL",
    adults: String(q.adultos),
    travel_class: String(q.classe),
  };
  if (q.diasViagem) params.round_trip_days = String(q.diasViagem);
  if (q.soDiretos) params.stops = "1";
  const body = await chamar(params);
  const meta = body.search_metadata as { google_flights_calendar_url?: string } | undefined;
  return { dias: lerCalendario((body.prices as PrecoBruto[]) ?? [], q.inicio, q.fim), exemplo: false, consultadoEm, linkGoogle: meta?.google_flights_calendar_url };
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
  location_rating?: number;
  nearby_places?: { name?: string; transportations?: { type?: string; duration?: string }[] }[];
}

const MEIO: Record<string, string> = { walking: "a pé", taxi: "de táxi", "public transport": "de transporte público", driving: "de carro" };

function lerPerto(lista: PropriedadeBruta["nearby_places"]): { nome: string; como: string | null }[] {
  return (lista ?? [])
    .filter((l) => l.name)
    .slice(0, 4)
    .map((l) => {
      const t = l.transportations?.[0];
      const meio = t?.type ? (MEIO[t.type.toLowerCase()] ?? t.type) : null;
      return { nome: l.name!, como: t?.duration ? [meio, t.duration].filter(Boolean).join(" ") : null };
    });
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
    notaLocal: typeof p.location_rating === "number" ? p.location_rating : null,
    perto: lerPerto(p.nearby_places),
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
