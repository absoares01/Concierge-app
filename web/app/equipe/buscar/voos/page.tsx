import Link from "next/link";
import { buscarVoos } from "@/lib/serpapi";
import { ranquearVoos } from "@/lib/ranking";
import { brl, dataComDia, duracao, hora, quando } from "@/lib/format";
import { iata, uuidOuNulo } from "@/lib/validar";
import { tituloDaViagem, viagensAbertas } from "@/lib/viagens-abertas";
import type { BuscaVoos, ResultadoVoos, Voo } from "@/lib/types";
import { AdicionarABusca } from "@/components/AdicionarABusca";
import { AvisoExemplo, Botao, Campo, Cartao, Etiqueta, Selecao, Titulo, Vazio, cx } from "@/components/ui";

type Params = Record<string, string | undefined>;

const ORDENS = [
  { id: "melhor", rotulo: "Melhor" },
  { id: "barato", rotulo: "Mais barato" },
  { id: "rapido", rotulo: "Mais rápido" },
] as const;

function lerBusca(p: Params): BuscaVoos | null {
  const origem = iata(p.origem ?? null);
  const destino = iata(p.destino ?? null);
  const ida = p.ida && /^\d{4}-\d{2}-\d{2}$/.test(p.ida) ? p.ida : null;
  if (!origem || !destino || !ida) return null;
  const volta = p.volta && /^\d{4}-\d{2}-\d{2}$/.test(p.volta) ? p.volta : undefined;
  const adultos = Math.min(9, Math.max(1, Number(p.adultos) || 1));
  const classe = ([1, 2, 3, 4] as const).find((c) => String(c) === p.classe) ?? 1;
  return { origem, destino, ida, volta, adultos, classe, soDiretos: p.diretos === "on" };
}

function descricaoVoo(v: Voo, q: BuscaVoos): string {
  const linhas = v.trechos.map((t) => `${t.companhia} ${t.numero}: ${t.de} ${hora(t.partida)} → ${t.para} ${hora(t.chegada)}`);
  linhas.push(`Duração da ida: ${duracao(v.duracaoMin)} · ${v.escalas === 0 ? "direto" : `${v.escalas} escala(s)`}`);
  linhas.push(`Bagagem: ${v.bagagem.texto}`);
  linhas.push(`Preço total para ${q.adultos} ${q.adultos === 1 ? "adulto" : "adultos"}${q.volta ? ", ida e volta" : ""}.`);
  if (q.volta) linhas.push("Horários da volta: confirmar no link antes de comprar.");
  return linhas.join("\n");
}

export default async function BuscarVoos({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const viagemId = uuidOuNulo(p.viagem);
  const busca = lerBusca(p);
  const ordem = ORDENS.find((o) => o.id === p.ordem)?.id ?? "melhor";

  let resultado: ResultadoVoos | null = null;
  let erro: string | null = null;
  if (busca) {
    try {
      resultado = await buscarVoos(busca);
    } catch (e) {
      erro = (e as Error).message;
    }
  }
  const [viagens, viagemTitulo] = await Promise.all([viagemId ? Promise.resolve([]) : viagensAbertas(), tituloDaViagem(viagemId)]);

  let lista = resultado ? ranquearVoos(resultado.voos) : [];
  if (ordem === "barato") lista = [...lista].sort((a, b) => a.item.preco! - b.item.preco!);
  if (ordem === "rapido") lista = [...lista].sort((a, b) => a.item.duracaoMin - b.item.duracaoMin || a.item.preco! - b.item.preco!);
  const melhorId = resultado ? ranquearVoos(resultado.voos)[0]?.item.id : undefined;

  const linkOrdem = (o: string) => {
    const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][]);
    q.set("ordem", o);
    return `?${q.toString()}`;
  };

  return (
    <>
      <Titulo sobretitulo={viagemTitulo ? `para ${viagemTitulo}` : "preços reais do Google Flights"}>Buscar voos</Titulo>

      <Cartao>
        <form method="get" className="flex flex-col gap-4">
          {viagemId && <input type="hidden" name="viagem" value={viagemId} />}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] items-end gap-3">
            <Campo rotulo="Origem (IATA)" id="origem" required defaultValue={p.origem ?? ""} placeholder="GRU, VCP" />
            <Campo rotulo="Destino (IATA)" id="destino" required defaultValue={p.destino ?? ""} placeholder="LIS" />
            <Campo rotulo="Ida" id="ida" type="date" required defaultValue={p.ida ?? ""} />
            <Campo rotulo="Volta" id="volta" type="date" defaultValue={p.volta ?? ""} />
            <Campo rotulo="Adultos" id="adultos" type="number" min={1} max={9} defaultValue={p.adultos ?? "1"} />
            <Selecao rotulo="Classe" id="classe" defaultValue={p.classe ?? "1"}>
              <option value="1">Econômica</option>
              <option value="2">Premium</option>
              <option value="3">Executiva</option>
              <option value="4">Primeira</option>
            </Selecao>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="diretos" defaultChecked={p.diretos === "on"} className="h-[18px] w-[18px] accent-terracota" />
              Só voos diretos
            </label>
            <Botao type="submit">Buscar</Botao>
          </div>
          <p className="text-xs text-suave">
            Códigos de aeroporto separados por vírgula comparam alternativas (ex.: GRU, VCP). Milhas brasileiras ainda não têm fonte automática: registre a cotação como item manual na viagem.
          </p>
        </form>
      </Cartao>

      {erro && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-erro">
          Não foi possível buscar agora. {erro}
        </p>
      )}

      {resultado && (
        <section className="flex flex-col gap-4" aria-label="Resultados">
          {resultado.exemplo && <AvisoExemplo />}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-suave">
            <span>
              {lista.length} opções · consultado {quando(resultado.consultadoEm)}
              {resultado.faixaTipica?.min && resultado.faixaTipica?.max
                ? ` · faixa típica ${brl(resultado.faixaTipica.min)} a ${brl(resultado.faixaTipica.max)}`
                : ""}
            </span>
            {resultado.linkGoogle && (
              <a href={resultado.linkGoogle} target="_blank" rel="noopener noreferrer">
                Abrir no Google Flights
              </a>
            )}
          </div>

          <nav aria-label="Ordenar" className="grid grid-cols-3 gap-2">
            {ORDENS.map((o) => (
              <Link
                key={o.id}
                href={linkOrdem(o.id)}
                aria-current={ordem === o.id ? "true" : undefined}
                className={cx(
                  "flex h-12 items-center justify-center rounded-[14px] border text-sm font-semibold no-underline",
                  ordem === o.id ? "border-noite bg-noite text-creme hover:text-creme" : "border-borda bg-white text-tinta hover:text-tinta",
                )}
              >
                {o.rotulo}
              </Link>
            ))}
          </nav>

          {lista.length === 0 && <Vazio>Nenhum voo encontrado para essa combinação. Tente outras datas ou aeroportos.</Vazio>}

          {lista.map(({ item: v, nota, motivos }) => {
            const destaque = v.id === melhorId;
            return (
              <article key={v.id} className={cx("flex flex-col gap-4 rounded-[20px] border bg-white px-5 py-5 md:px-6", destaque ? "border-[1.5px] border-terracota shadow-[0_18px_40px_-28px_rgba(168,76,42,0.55)]" : "border-borda")}>
                {destaque && <Etiqueta cor="forte" className="self-start uppercase tracking-wide">Melhor escolha</Etiqueta>}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex min-w-0 flex-[1_1_320px] items-center gap-4">
                    {v.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.logo} alt="" className="h-11 w-11 rounded-[12px] bg-areia object-contain p-1.5" />
                    ) : (
                      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-areia text-xs font-semibold text-suave">
                        {v.companhias[0]?.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-baseline gap-2 text-xl font-semibold">
                        {hora(v.partida)} <span className="text-[13px] font-medium text-suave">{v.origem}</span>
                        <span aria-hidden="true" className="font-normal text-[#C85A32]">→</span>
                        {hora(v.chegada)} <span className="text-[13px] font-medium text-suave">{v.destino}</span>
                        {v.chegada.slice(0, 10) !== v.partida.slice(0, 10) && <span className="text-[13px] font-medium text-suave">+1</span>}
                      </div>
                      <span className="text-sm text-suave">
                        {v.companhias.join(", ")} · {duracao(v.duracaoMin)} · {v.escalas === 0 ? "Direto" : `${v.escalas} ${v.escalas === 1 ? "escala" : "escalas"} (${v.conexoes.map((c) => c.aeroporto).join(", ")})`}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <Etiqueta cor={v.bagagem.status === "incluida" ? "verde" : v.bagagem.status === "nao_incluida" ? "aviso" : "neutra"}>
                          {v.bagagem.status === "incluida" ? "Bagagem incluída" : v.bagagem.status === "nao_incluida" ? "Bagagem paga à parte" : "Bagagem a confirmar"}
                        </Etiqueta>
                        {v.trocaAeroporto && <Etiqueta cor="aviso">Troca de aeroporto</Etiqueta>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-[0_1_200px] flex-col items-end text-right">
                    <strong className="font-serif text-[28px] font-medium">{brl(v.preco)}</strong>
                    <span className="text-[13px] text-suave">
                      total, {busca!.adultos} {busca!.adultos === 1 ? "adulto" : "adultos"}
                      {busca!.volta ? ", ida e volta" : ""}
                    </span>
                    <span className="text-xs text-suave">nota {nota.toFixed(1).replace(".", ",")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-realce pt-3">
                  <span className="flex-[1_1_300px] text-sm text-salvia">
                    <strong className="font-semibold">Por que aqui:</strong> {motivos.join("; ")}.
                  </span>
                  <AdicionarABusca
                    viagemId={viagemId}
                    viagens={viagens}
                    exemplo={resultado!.exemplo}
                    campos={{
                      tipo: "voo",
                      titulo: `${v.companhias.join(", ")} · ${v.origem} → ${v.destino}${busca!.volta ? " (ida e volta)" : ""}`,
                      descricao: descricaoVoo(v, busca!),
                      data: busca!.ida,
                      hora: hora(v.partida),
                      data_fim: busca!.volta ?? null,
                      local: `${v.origem} → ${v.destino}`,
                      preco: v.preco,
                      link_compra: resultado!.linkGoogle ?? null,
                      fonte: "Google Flights via SerpApi",
                      consultado_em: resultado!.consultadoEm,
                      dados: JSON.stringify(v),
                    }}
                  />
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-suave">Detalhes dos trechos</summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {v.trechos.map((t, k) => (
                      <li key={k}>
                        {dataComDia(t.partida)} · {t.companhia} {t.numero}: {t.de} {hora(t.partida)} → {t.para} {hora(t.chegada)} ({duracao(t.duracaoMin)})
                      </li>
                    ))}
                    {v.conexoes.map((c, k) => (
                      <li key={`c${k}`} className="text-suave">
                        Conexão em {c.aeroporto}: {duracao(c.duracaoMin)}
                      </li>
                    ))}
                    <li className="text-suave">{v.bagagem.texto}</li>
                  </ul>
                </details>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
