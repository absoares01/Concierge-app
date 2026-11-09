import Link from "next/link";
import { buscarHospedagem } from "@/lib/serpapi";
import { ranquearHospedagem } from "@/lib/ranking";
import { brl, quando } from "@/lib/format";
import { linkSeguro, uuidOuNulo } from "@/lib/validar";
import { tituloDaViagem, viagensAbertas } from "@/lib/viagens-abertas";
import type { BuscaHospedagem, Hospedagem, ResultadoHospedagem } from "@/lib/types";
import { AdicionarABusca } from "@/components/AdicionarABusca";
import { AvisoExemplo, Botao, Campo, Cartao, Etiqueta, Icone, Titulo, Vazio, cx } from "@/components/ui";

type Params = Record<string, string | undefined>;

const ORDENS = [
  { id: "melhor", rotulo: "Melhor" },
  { id: "preco", rotulo: "Menor preço total" },
  { id: "nota", rotulo: "Nota" },
] as const;

function lerBusca(p: Params): BuscaHospedagem | null {
  const destino = p.destino?.trim().slice(0, 120);
  const ok = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  const entrada = ok(p.entrada);
  const saida = ok(p.saida);
  if (!destino || !entrada || !saida || saida <= entrada) return null;
  return { destino, entrada, saida, adultos: Math.min(12, Math.max(1, Number(p.adultos) || 2)), temporada: p.temporada === "on" };
}

function descricao(h: Hospedagem, noites: number): string {
  const partes = [
    h.temporada ? "Aluguel por temporada" : h.estrelas ? `Hotel ${h.estrelas} estrelas` : "Hospedagem",
    h.nota !== null ? `nota ${h.nota.toFixed(1).replace(".", ",")} de 5${h.avaliacoes ? ` (${h.avaliacoes} avaliações)` : ""}` : null,
    `${noites} ${noites === 1 ? "noite" : "noites"}${h.porNoite ? `, ${brl(h.porNoite)} por noite` : ""}`,
    h.comodidades.length ? `Comodidades: ${h.comodidades.join(", ")}` : null,
    "Confirmar política de cancelamento e taxas no site antes de reservar.",
  ];
  return partes.filter(Boolean).join("\n");
}

export default async function BuscarHospedagem({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const viagemId = uuidOuNulo(p.viagem);
  const busca = lerBusca(p);
  const ordem = ORDENS.find((o) => o.id === p.ordem)?.id ?? "melhor";

  let resultado: ResultadoHospedagem | null = null;
  let erro: string | null = null;
  if (busca) {
    try {
      resultado = await buscarHospedagem(busca);
    } catch (e) {
      erro = (e as Error).message;
    }
  }
  const [viagens, viagemTitulo] = await Promise.all([viagemId ? Promise.resolve([]) : viagensAbertas(), tituloDaViagem(viagemId)]);

  const ranqueados = resultado ? ranquearHospedagem(resultado.opcoes) : [];
  const melhorId = ranqueados[0]?.item.id;
  let lista = ranqueados;
  if (ordem === "preco") lista = [...lista].sort((a, b) => a.item.total! - b.item.total!);
  if (ordem === "nota") lista = [...lista].sort((a, b) => (b.item.nota ?? 0) - (a.item.nota ?? 0));

  const linkOrdem = (o: string) => {
    const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][]);
    q.set("ordem", o);
    return `?${q.toString()}`;
  };

  return (
    <>
      <Titulo sobretitulo={viagemTitulo ? `para ${viagemTitulo}` : "hotéis e aluguel por temporada"}>Buscar hospedagem</Titulo>

      <Cartao>
        <form method="get" className="flex flex-col gap-4">
          {viagemId && <input type="hidden" name="viagem" value={viagemId} />}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-end gap-3">
            <Campo rotulo="Destino" id="destino" required defaultValue={p.destino ?? ""} placeholder="Ex.: Chiado, Lisboa" className="md:col-span-2" />
            <Campo rotulo="Check-in" id="entrada" type="date" required defaultValue={p.entrada ?? ""} />
            <Campo rotulo="Check-out" id="saida" type="date" required defaultValue={p.saida ?? ""} />
            <Campo rotulo="Hóspedes" id="adultos" type="number" min={1} max={12} defaultValue={p.adultos ?? "2"} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="temporada" defaultChecked={p.temporada === "on"} className="h-[18px] w-[18px] accent-terracota" />
              Aluguel por temporada (casas e apartamentos)
            </label>
            <Botao type="submit">Buscar</Botao>
          </div>
          <p className="text-xs text-suave">
            Fonte: Google Hotels via SerpApi, com preços de vários sites. O Airbnb não tem API pública: para um anúncio específico, adicione como item manual com o link.
          </p>
        </form>
      </Cartao>

      {erro && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-erro">
          Não foi possível buscar agora. {erro}
        </p>
      )}

      {resultado && busca && (
        <section className="flex flex-col gap-4" aria-label="Resultados">
          {resultado.exemplo && <AvisoExemplo />}
          <p className="text-sm text-suave">
            {lista.length} opções · {resultado.noites} {resultado.noites === 1 ? "noite" : "noites"} · consultado {quando(resultado.consultadoEm)} · o destaque é sempre pelo critério abaixo, nunca por
            parceria.
          </p>

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

          {lista.length === 0 && <Vazio>Nenhuma hospedagem com preço para essas datas.</Vazio>}

          {lista.map(({ item: h, nota, motivos }) => {
            const link = linkSeguro(h.link) ?? linkSeguro(h.ofertas.find((o) => o.link)?.link);
            const ofertas = [...h.ofertas].filter((o) => o.porNoite !== null).sort((a, b) => a.porNoite! - b.porNoite!);
            return (
              <article
                key={h.id}
                className={cx(
                  "flex flex-wrap gap-5 rounded-[20px] border bg-white p-4",
                  h.id === melhorId ? "border-[1.5px] border-terracota shadow-[0_18px_40px_-28px_rgba(168,76,42,0.55)]" : "border-borda",
                )}
              >
                {h.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.foto} alt={`Foto de ${h.nome}`} className="h-[150px] w-full rounded-[14px] object-cover sm:w-[200px]" />
                ) : (
                  <div aria-hidden="true" className="flex h-[150px] w-full items-center justify-center rounded-[14px] bg-areia text-suave sm:w-[200px]">
                    <Icone nome="cama" tamanho={28} />
                  </div>
                )}
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {h.id === melhorId && <Etiqueta cor="forte">Melhor escolha</Etiqueta>}
                    <Etiqueta cor={h.temporada ? "terracota" : "neutra"}>{h.temporada ? "Temporada" : h.estrelas ? `Hotel ${h.estrelas}★` : h.tipo}</Etiqueta>
                  </div>
                  <h3 className="font-serif text-[22px]">{h.nome}</h3>
                  {h.nota !== null && (
                    <span className="text-sm">
                      <strong className="font-semibold">{h.nota.toFixed(1).replace(".", ",")}</strong>
                      <span className="text-suave"> de 5{h.avaliacoes ? ` · ${h.avaliacoes} avaliações` : ""}</span>
                    </span>
                  )}
                  {h.comodidades.length > 0 && <span className="text-[13px] text-suave">{h.comodidades.join(" · ")}</span>}
                  {ofertas.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                      {ofertas.slice(0, 4).map((o, k) => (
                        <li key={k}>
                          {o.site}: <strong className="font-semibold">{brl(o.porNoite)}</strong>/noite
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className="text-[13px] text-salvia">
                    <strong className="font-semibold">Por que aqui:</strong> {motivos.join("; ")}.
                  </span>
                </div>
                <div className="flex flex-[0_1_220px] flex-col items-end justify-between gap-3 text-right">
                  <div className="flex flex-col items-end">
                    <strong className="font-serif text-[27px] font-medium">{brl(h.total)}</strong>
                    <span className="text-[13px] text-suave">
                      {resultado!.noites} {resultado!.noites === 1 ? "noite" : "noites"}
                      {h.porNoite ? ` · ${brl(h.porNoite)}/noite` : ""}
                    </span>
                    <span className="text-xs text-suave">nota {nota.toFixed(1).replace(".", ",")}</span>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm">
                        Ver no site <Icone nome="link" tamanho={14} />
                      </a>
                    )}
                  </div>
                  <AdicionarABusca
                    viagemId={viagemId}
                    viagens={viagens}
                    exemplo={resultado!.exemplo}
                    campos={{
                      tipo: "hospedagem",
                      titulo: h.nome,
                      descricao: descricao(h, resultado!.noites),
                      data: busca.entrada,
                      data_fim: busca.saida,
                      local: busca.destino,
                      preco: h.total,
                      link_compra: link,
                      fonte: "Google Hotels via SerpApi",
                      consultado_em: resultado!.consultadoEm,
                      dados: JSON.stringify(h),
                    }}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
