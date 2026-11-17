// Testes da lógica que não depende de banco nem de internet.
// Rode com: npm run test:logic
import { lerOfertas, normalizarHospedagem, normalizarVoo } from "../lib/serpapi";
import { ranquearHospedagem, ranquearVoos } from "../lib/ranking";
import { agruparPorDia, calcularOrcamento } from "../lib/orcamento";
import { hospedagensExemplo, ofertasExemplo, voltasExemplo, voosExemplo } from "../lib/exemplo";
import { iata, linkSeguro } from "../lib/validar";
import { dataComDia, diasEntre } from "../lib/format";
import type { ItemViagem } from "../lib/types";
import { adultosDe, somarDias } from "../lib/datas";
import { riscoDe } from "../lib/agencias";
import { lerBusca, linkSkyscanner, paramsDaBusca } from "../lib/busca-voos";

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

// --- Fichas para a lista de sites ---
const comFicha = normalizarVoo({ ...bruto, booking_token: "WyJib29raW5nIl0=" })!;
confere("Ficha de reserva guardada no voo", comFicha.tokenReserva === "WyJib29raW5nIl0=" && comFicha.tokenIda === undefined);
const idaVolta = normalizarVoo({ ...bruto, departure_token: "WyJkZXBhcnR1cmUiXQ==" })!;
confere("Ficha da ida guardada no voo", idaVolta.tokenIda === "WyJkZXBhcnR1cmUiXQ==");
confere("Exemplo ida e volta abre a escolha da volta", voosExemplo({ origem: "GRU", destino: "LIS", ida: "2027-05-12", volta: "2027-05-23", adultos: 1, classe: 1 }).every((v) => v.tokenIda && !v.tokenReserva));
confere("Voltas de exemplo saem do destino", voltasExemplo({ origem: "GRU", destino: "LIS", ida: "2027-05-12", volta: "2027-05-23", adultos: 1, classe: 1 }).every((v) => v.origem === "LIS" && v.tokenReserva));
confere("Sites de exemplo ordenados por preço", (() => { const o = ofertasExemplo({ origem: "GRU", destino: "LIS", ida: "2027-05-12", adultos: 1, classe: 1 }, "x").ofertas; return o.every((x, i) => i === 0 || o[i - 1].preco! <= x.preco!); })());

// --- Leitura dos sites (booking options da SerpApi) ---
const ofertas = lerOfertas([
  { together: { book_with: "LATAM", airline: true, price: 3210, option_title: "Light", extensions: ["Bagagem de mão"], baggage_prices: ["1 bagagem de mão gratuita"], booking_request: { url: "https://www.google.com/travel/clk/f", post_data: "u=ABC123&x=1" } } },
  { together: { book_with: "123milhas", airline: false, price: 2890, booking_request: { url: "https://www.google.com/travel/clk/f", post_data: "u=DEF" } } },
  { together: { book_with: "Site suspeito", price: 100, booking_request: { url: "javascript:alert(1)" } } },
  { together: { book_with: "Outro domínio", price: 150, booking_request: { url: "https://exemplo.com/clk" } } },
  { separate_tickets: true, departing: { book_with: "Gol", airline: true, price: 1500 }, returning: { book_with: "Azul", airline: true, price: 1600 } },
  { together: { price: 50 } },
]);
confere("Sites lidos e sem vendedor descartado", ofertas.length === 5, ofertas.map((o) => o.vendedor));
confere("Sites em ordem de preço", ofertas.every((x, i) => i === 0 || (ofertas[i - 1].preco ?? Infinity) <= (x.preco ?? Infinity)));
const latam = ofertas.find((o) => o.vendedor === "LATAM")!;
confere("Companhia reconhecida e campos do POST lidos", latam.ehCompanhia && latam.tarifa === "Light" && latam.links[0]?.campos[0]?.[0] === "u" && latam.links[0]?.campos[0]?.[1] === "ABC123", latam);
confere("Link javascript: do vendedor bloqueado", ofertas.find((o) => o.vendedor === "Site suspeito")!.links.length === 0);
confere("Link fora do Google bloqueado", ofertas.find((o) => o.vendedor === "Outro domínio")!.links.length === 0);
const separado = ofertas.find((o) => o.separado)!;
confere("Bilhetes separados somados", separado.vendedor === "Gol + Azul" && separado.preco === 3100 && separado.ehCompanhia, separado);

// --- Agências que emitem com milhas ---
confere("123milhas detectada pelo nome", riscoDe("123milhas")?.agencia === "123milhas");
confere("123 Milhas com espaço detectada", riscoDe("123 Milhas via Google Flights")?.agencia === "123milhas");
confere("MaxMilhas detectada", riscoDe(null, "Voo · MaxMilhas")?.agencia === "MaxMilhas");
confere("Detectada pelo domínio do link", riscoDe(null, null, "https://www.123milhas.com/passagens")?.agencia === "123milhas");
confere("Companhia aérea não é marcada", riscoDe("LATAM via Google Flights", "LATAM · GRU → LIS", "https://www.google.com/travel/flights") === null);
confere("Programa de milhas da companhia não é marcado", riscoDe("Smiles", "Voo com milhas Smiles", "https://www.smiles.com.br/") === null);
confere("Aviso para o cliente é curto e sem citar processo", !/judicial/i.test(riscoDe("123milhas")!.curto));

// --- Busca de voos no endereço e link do Skyscanner ---
const q = lerBusca({ origem: "gru", destino: "lis", ida: "2027-05-12", volta: "2027-05-23", adultos: "2", classe: "3" })!;
confere("Busca lida do endereço", q.origem === "GRU" && q.adultos === 2 && q.classe === 3 && q.volta === "2027-05-23");
confere("Busca sem data é recusada", lerBusca({ origem: "GRU", destino: "LIS" }) === null);
confere("Busca volta ao endereço", lerBusca(Object.fromEntries(new URLSearchParams(paramsDaBusca(q)))) !== null);
confere("Link do Skyscanner ida e volta", linkSkyscanner(q) === "https://www.skyscanner.com.br/transport/flights/gru/lis/270512/270523/?adultsv2=2&cabinclass=business&rtn=1", linkSkyscanner(q));
confere("Link do Skyscanner só ida, primeiro aeroporto", linkSkyscanner({ origem: "GRU,VCP", destino: "MCO", ida: "2027-01-05", adultos: 1, classe: 1 }) === "https://www.skyscanner.com.br/transport/flights/gru/mco/270105/?adultsv2=1&cabinclass=economy&rtn=0");

console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
