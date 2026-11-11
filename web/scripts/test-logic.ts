// Testes da lógica que não depende de banco nem de internet.
// Rode com: npm run test:logic
import { normalizarHospedagem, normalizarVoo } from "../lib/serpapi";
import { ranquearHospedagem, ranquearVoos } from "../lib/ranking";
import { agruparPorDia, calcularOrcamento } from "../lib/orcamento";
import { voosExemplo, hospedagensExemplo } from "../lib/exemplo";
import { iata, linkSeguro } from "../lib/validar";
import { dataComDia, diasEntre } from "../lib/format";
import type { ItemViagem } from "../lib/types";
import { adultosDe, somarDias } from "../lib/datas";

let falhas = 0;
function confere(nome: string, ok: boolean, detalhe?: unknown) {
  console.log(`${ok ? "✓" : "✗"} ${nome}${!ok && detalhe !== undefined ? ` — ${JSON.stringify(detalhe)}` : ""}`);
  if (!ok) falhas++;
}

// --- Normalização de um voo no formato da SerpApi ---
const bruto = {
  flights: [
    { departure_airport: { id: "GRU", name: "Guarulhos", time: "2027-05-12 22:05" }, arrival_airport: { id: "LIS", name: "Lisboa", time: "2027-05-13 11:45" }, duration: 580, airline: "TAP Air Portugal", flight_number: "TP 88", extensions: ["1st checked bag included"] },
  ],
  total_duration: 580,
  price: 9740,
};
const voo = normalizarVoo(bruto)!;
confere("Voo direto normalizado", voo.escalas === 0 && voo.origem === "GRU" && voo.destino === "LIS" && voo.preco === 9740);
confere("Bagagem incluída reconhecida", voo.bagagem.status === "incluida", voo.bagagem);

const conexaoTrocada = normalizarVoo({
  flights: [
    { departure_airport: { id: "GRU", time: "2027-05-12 10:00" }, arrival_airport: { id: "CDG", time: "2027-05-13 02:00" }, duration: 660, airline: "X" },
    { departure_airport: { id: "ORY", time: "2027-05-13 06:00" }, arrival_airport: { id: "LIS", time: "2027-05-13 08:00" }, duration: 150, airline: "Y" },
  ],
  layovers: [{ id: "CDG", duration: 240 }],
  price: 5000,
})!;
confere("Troca de aeroporto detectada", conexaoTrocada.trocaAeroporto && conexaoTrocada.escalas === 1);

// --- Ranking de voos ---
const lista = voosExemplo({ origem: "GRU", destino: "LIS", ida: "2027-05-12", volta: "2027-05-23", adultos: 2, classe: 1 });
const r = ranquearVoos(lista);
confere("Ranking devolve todas as opções com preço", r.length === lista.length);
confere("Ranking em ordem decrescente de nota", r.every((x, i) => i === 0 || r[i - 1].nota >= x.nota));
confere("Toda opção tem explicação", r.every((x) => x.motivos.length >= 3));
const maisBarato = Math.min(...lista.map((v) => v.preco!));
confere("Mais barato é identificado no motivo", r.some((x) => x.item.preco === maisBarato && x.motivos[0] === "o menor preço da busca"));
confere("Notas entre 0 e 10", r.every((x) => x.nota >= 0 && x.nota <= 10));

// --- Hospedagem ---
const h = normalizarHospedagem({ name: "Hotel Teste", rate_per_night: { extracted_lowest: 500 }, overall_rating: 4.6, reviews: 300, extracted_hotel_class: 4 }, 6)!;
confere("Total calculado pelas noites quando a fonte não traz", h.total === 3000, h);
const t = normalizarHospedagem({ name: "Casa", type: "vacation rental", total_rate: { extracted_lowest: 2100 } }, 6)!;
confere("Aluguel por temporada reconhecido", t.temporada && t.total === 2100);
const rh = ranquearHospedagem(hospedagensExemplo({ destino: "Lisboa", entrada: "2027-05-13", saida: "2027-05-19", adultos: 2, temporada: false }, 6));
confere("Ranking de hospedagem ordenado", rh.every((x, i) => i === 0 || rh[i - 1].nota >= x.nota));

// --- Orçamento ---
const base = { viagem_id: "v", descricao: null, hora: null, data_fim: null, local: null, moeda: "BRL", preco_ref: "total", programa: null, taxas: null, link_compra: null, fonte: null, consultado_em: null, visivel_cliente: true, ordem: 0, criado_em: "" } as const;
const itens: ItemViagem[] = [
  { ...base, id: "1", tipo: "voo", titulo: "Voo A", data: "2027-05-12", preco: 9740, milhas: null, situacao: "recomendado" },
  { ...base, id: "2", tipo: "voo", titulo: "Voo B (alternativa)", data: "2027-05-12", preco: 8360, milhas: null, situacao: "sugestao" },
  { ...base, id: "3", tipo: "voo", titulo: "Voo milhas", data: "2027-05-23", preco: null, milhas: 70000, taxas: 1120, situacao: "reservado" },
  { ...base, id: "4", tipo: "hospedagem", titulo: "Hotel", data: "2027-05-13", preco: 5640, milhas: null, situacao: "reservado" },
  { ...base, id: "5", tipo: "atividade", titulo: "Belém", data: "2027-05-14", hora: "09:30", preco: null, milhas: null, situacao: "recomendado" },
];
const o = calcularOrcamento(itens);
confere("Orçamento ignora sugestões", o.totalDinheiro === 9740 + 1120 + 5640, o);
confere("Orçamento soma milhas", o.totalMilhas === 70000);
confere("Orçamento conta pendentes", o.pendentes === 1);
const dias = agruparPorDia(itens);
confere("Roteiro agrupado por dia em ordem", dias.map((d) => d.data).join(",") === "2027-05-12,2027-05-13,2027-05-14,2027-05-23");

// --- Validação ---
confere("Link javascript: é bloqueado", linkSeguro("javascript:alert(1)") === null);
confere("Link https é aceito", linkSeguro("https://www.flytap.com/") === "https://www.flytap.com/");
confere("Códigos IATA normalizados", iata("gru, vcp x") === "GRU,VCP");
confere("Dia da semana correto", dataComDia("2027-05-12") === "qua, 12 mai", dataComDia("2027-05-12"));
confere("Noites entre datas", diasEntre("2027-05-13", "2027-05-19") === 6);

// --- Datas automáticas e viajantes ---
confere("Volta automática no dia seguinte", somarDias("2027-05-12", 1) === "2027-05-13");
confere("Virada de mês", somarDias("2027-01-31", 1) === "2027-02-01");
confere("Virada de ano", somarDias("2026-12-31", 1) === "2027-01-01");
confere("Ano bissexto", somarDias("2028-02-28", 1) === "2028-02-29");
confere("Adultos de '2 adultos, 1 criança'", adultosDe("2 adultos, 1 criança") === 2);
confere("Adultos de 'casal' (sem número)", adultosDe("casal") === null);
confere("Adultos de '4 pessoas'", adultosDe("4 pessoas") === 4);

console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
