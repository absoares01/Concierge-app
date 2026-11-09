import type { BuscaHospedagem, BuscaVoos, Hospedagem, Voo } from "./types";

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
      lat: null,
      lon: null,
      ofertas: [
        { site: "Site exemplo 1", porNoite, link: null },
        { site: "Site exemplo 2", porNoite: porNoite + 40, link: null },
      ],
      comodidades: ["Wi-Fi", q.temporada ? "Cozinha" : "Café da manhã"],
    };
  });
}
