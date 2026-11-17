import type { BuscaCalendario, BuscaHospedagem, BuscaVoos, Hospedagem, OfertaVoo, PrecoDia, Voo } from "./types";

// DADOS DE EXEMPLO, usados só quando não há SERPAPI_KEY. Nomes propositalmente
// fictícios para nunca serem confundidos com ofertas reais.

function semente(texto: string): () => number {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function somaMin(dataHora: string, min: number): string {
  const d = new Date(dataHora.replace(" ", "T") + ":00Z");
  d.setUTCMinutes(d.getUTCMinutes() + min);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function voosExemplo(q: BuscaVoos): Voo[] {
  const r = semente(`${q.origem}${q.destino}${q.ida}${q.volta ?? ""}`);
  const cias = ["Aérea Exemplo A", "Aérea Exemplo B", "Aérea Exemplo C", "Aérea Exemplo D"];
  const conexoes = ["HUB", "MID", "CNX"];
  const voos: Voo[] = [];
  for (let i = 0; i < 8; i++) {
    const escalas = q.soDiretos ? 0 : i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2 - (i % 2);
    const cia = cias[i % cias.length];
    const hora = 6 + Math.floor(r() * 17);
    const partida = `${q.ida} ${String(hora).padStart(2, "0")}:${r() < 0.5 ? "05" : "40"}`;
    const voo = 120 + Math.floor(r() * 500);
    const espera = escalas ? 60 + Math.floor(r() * 300) : 0;
    const total = voo + espera * escalas;
    const chegada = somaMin(partida, total);
    const base = 900 + Math.floor(r() * 3500) - escalas * 250;
    const preco = Math.round((base * q.adultos * (q.volta ? 1.8 : 1)) / 10) * 10;
    const trechos = [];
    let t = partida;
    const pontos = [q.origem, ...conexoes.slice(0, escalas), q.destino];
    for (let k = 0; k < pontos.length - 1; k++) {
      const dur = Math.round(voo / (escalas + 1));
      const chega = somaMin(t, dur);
      trechos.push({ companhia: cia, numero: `EX ${100 + i * 10 + k}`, de: pontos[k], deNome: pontos[k], para: pontos[k + 1], paraNome: pontos[k + 1], partida: t, chegada: chega, duracaoMin: dur });
      t = somaMin(chega, espera);
    }
    const bag = i % 2 === 0 ? "incluida" : i % 3 === 0 ? "nao_incluida" : "nao_informada";
    voos.push({
      id: `exemplo-${i}`,
      preco,
      companhias: [cia],
      duracaoMin: total,
      escalas,
      conexoes: conexoes.slice(0, escalas).map((a) => ({ aeroporto: a, duracaoMin: espera })),
      trechos,
      origem: q.origem,
      destino: q.destino,
      partida,
      chegada,
      trocaAeroporto: false,
      conexaoLongaMin: espera,
      bagagem: {
        status: bag,
        texto: bag === "incluida" ? "1 bagagem despachada incluída (exemplo)" : bag === "nao_incluida" ? "Bagagem despachada cobrada à parte (exemplo)" : "Bagagem não informada (exemplo)",
      },
      ...(q.volta ? { tokenIda: `exemplo-ida-${i}` } : { tokenReserva: `exemplo-reserva-${i}` }),
    });
  }
  return voos;
}

export function hospedagensExemplo(q: BuscaHospedagem, noites: number): Hospedagem[] {
  const r = semente(`${q.destino}${q.entrada}${q.saida}${q.temporada}`);
  const nomes = q.temporada
    ? ["Apartamento Exemplo Centro", "Casa Exemplo com Varanda", "Estúdio Exemplo", "Loft Exemplo", "Apartamento Exemplo Jardim"]
    : ["Hotel Exemplo Centro", "Pousada Exemplo", "Hotel Exemplo Boutique", "Hotel Exemplo Praça", "Hostel Exemplo"];
  return nomes.map((nome, i) => {
    const porNoite = Math.round((250 + r() * 1100) / 10) * 10;
    return {
      id: `exemplo-h-${i}`,
      nome,
      tipo: q.temporada ? "aluguel por temporada" : "hotel",
      temporada: q.temporada,
      estrelas: q.temporada ? null : 2 + Math.floor(r() * 4),
      nota: Math.round((3.6 + r() * 1.3) * 10) / 10,
      avaliacoes: 40 + Math.floor(r() * 2000),
      porNoite,
      total: porNoite * noites,
      link: null,
      foto: null,
      // Pontos fictícios ao redor de um centro qualquer, só para ver o mapa funcionando.
      lat: -23.5614 + (r() - 0.5) * 0.04,
      lon: -46.6559 + (r() - 0.5) * 0.05,
      ofertas: [
        { site: "Site exemplo 1", porNoite, link: null },
        { site: "Site exemplo 2", porNoite: porNoite + 40, link: null },
      ],
      comodidades: ["Wi-Fi", q.temporada ? "Cozinha" : "Café da manhã"],
      notaLocal: Math.round((3 + r() * 2) * 10) / 10,
      perto: [{ nome: "Estação Exemplo", como: `a pé ${3 + Math.floor(r() * 12)} min` }],
    };
  });
}

// Voltas de exemplo (ida e volta): a mesma geração, no sentido contrário.
export function voltasExemplo(q: BuscaVoos): Voo[] {
  if (!q.volta) return [];
  return voosExemplo({ ...q, origem: q.destino, destino: q.origem, ida: q.volta, volta: undefined })
    .slice(0, 5)
    .map((v, i) => ({ ...v, id: `exemplo-volta-${i}`, tokenReserva: `exemplo-reserva-volta-${i}` }));
}

// Sites de exemplo: nomes fictícios, sem links.
export function ofertasExemplo(q: BuscaVoos, token: string): { ofertas: OfertaVoo[]; selecionados: Voo[] } {
  const r = semente(token);
  const ida = voosExemplo({ ...q, volta: undefined })[0];
  const base = Math.round((1500 + r() * 2500) * q.adultos * (q.volta ? 1.8 : 1));
  const vendedores = [
    { vendedor: "Aérea Exemplo A", ehCompanhia: true, fator: 1 },
    { vendedor: "Agência Exemplo 1", ehCompanhia: false, fator: 0.94 },
    { vendedor: "Agência Exemplo 2", ehCompanhia: false, fator: 0.97 },
    { vendedor: "Agência Exemplo 3", ehCompanhia: false, fator: 1.05 },
  ];
  return {
    selecionados: ida ? [ida] : [],
    ofertas: vendedores
      .map((v) => ({
        vendedor: v.vendedor,
        ehCompanhia: v.ehCompanhia,
        preco: Math.round((base * v.fator) / 10) * 10,
        tarifa: v.ehCompanhia ? "Tarifa exemplo com bagagem" : null,
        condicoes: v.ehCompanhia ? ["Marcação de assento (exemplo)"] : [],
        bagagem: v.ehCompanhia ? ["1 bagagem despachada incluída (exemplo)"] : [],
        separado: false,
        links: [],
        telefone: null,
      }))
      .sort((a, b) => a.preco - b.preco),
  };
}

// Calendário de exemplo: sexta e domingo mais caros, terça e quarta mais baratas.
export function calendarioExemplo(q: BuscaCalendario): PrecoDia[] {
  const r = semente(`${q.origem}${q.destino}${q.inicio}${q.diasViagem ?? 0}`);
  const pesoDia = [1.18, 1.02, 0.9, 0.92, 1.05, 1.25, 1.1];
  const dias: PrecoDia[] = [];
  const d = new Date(`${q.inicio}T12:00:00Z`);
  const fim = new Date(`${q.fim}T12:00:00Z`);
  while (d <= fim) {
    const ida = d.toISOString().slice(0, 10);
    const base = 1800 * q.adultos * (q.diasViagem ? 1.8 : 1);
    const preco = Math.round((base * pesoDia[d.getUTCDay()] * (0.85 + r() * 0.4)) / 10) * 10;
    let volta: string | null = null;
    if (q.diasViagem) {
      const v = new Date(d);
      v.setUTCDate(v.getUTCDate() + q.diasViagem);
      volta = v.toISOString().slice(0, 10);
    }
    dias.push({ ida, volta, preco, baixo: false });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const menor = Math.min(...dias.map((x) => x.preco));
  return dias.map((x) => ({ ...x, baixo: x.preco <= menor * 1.05 }));
}
