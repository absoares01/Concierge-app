"use client";

import { useMemo, useRef, useState } from "react";
import { brl } from "@/lib/format";
import { coordenadaValida, distanciaM, linkMapa, minutosAPe, textoDistancia, type Ponto } from "@/lib/geo";
import { descricaoHospedagem, precoCurto } from "@/lib/hospedagem";
import { linkSeguro } from "@/lib/validar";
import type { BuscaHospedagem, Hospedagem, Ranqueado } from "@/lib/types";
import { AdicionarABusca, type OpcaoViagem } from "./AdicionarABusca";
import { MapaHoteis, type PontoHotel } from "./MapaHoteis";
import { Etiqueta, Icone, cx } from "./ui";

// Lista de hospedagens com mapa ao lado. Tudo aqui acontece no navegador:
// ordenar, marcar um ponto de referência e medir distâncias não gastam crédito.

type Ordem = "melhor" | "preco" | "nota" | "local" | "perto";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "melhor", rotulo: "Melhor" },
  { id: "preco", rotulo: "Menor preço" },
  { id: "nota", rotulo: "Nota" },
  { id: "local", rotulo: "Localização" },
  { id: "perto", rotulo: "Mais perto" },
];

const virgula = (n: number) => n.toFixed(1).replace(".", ",");

function rotuloLocal(n: number): { texto: string; cor: "verde" | "neutra" | "aviso" } {
  if (n >= 4.5) return { texto: `Localização excelente ${virgula(n)}`, cor: "verde" };
  if (n >= 4) return { texto: `Localização muito boa ${virgula(n)}`, cor: "verde" };
  if (n >= 3.5) return { texto: `Localização boa ${virgula(n)}`, cor: "neutra" };
  return { texto: `Localização fraca ${virgula(n)}`, cor: "aviso" };
}

export function ResultadosHospedagem({
  ranqueados,
  noites,
  exemplo,
  consultadoEm,
  busca,
  viagemId,
  viagens,
  ordemInicial,
}: {
  ranqueados: Ranqueado<Hospedagem>[];
  noites: number;
  exemplo: boolean;
  consultadoEm: string;
  busca: BuscaHospedagem;
  viagemId: string | null;
  viagens: OpcaoViagem[];
  ordemInicial: string | undefined;
}) {
  const [ordem, setOrdem] = useState<Ordem>(ORDENS.find((o) => o.id === ordemInicial && o.id !== "perto")?.id ?? "melhor");
  const [referencia, setReferencia] = useState<Ponto | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const areaMapa = useRef<HTMLDivElement>(null);
  const melhorId = ranqueados[0]?.item.id;

  const pontos: PontoHotel[] = useMemo(
    () =>
      ranqueados
        .filter(({ item: h }) => coordenadaValida(h.lat, h.lon))
        .map(({ item: h }) => ({ id: h.id, lat: h.lat!, lon: h.lon!, rotulo: precoCurto(h.total), destaque: h.id === melhorId })),
    [ranqueados, melhorId],
  );
  const semLocal = ranqueados.length - pontos.length;

  const distancias = useMemo(() => {
    const d = new Map<string, number>();
    if (referencia) for (const p of pontos) d.set(p.id, distanciaM(referencia, p));
    return d;
  }, [referencia, pontos]);

  const lista = useMemo(() => {
    const l = [...ranqueados];
    if (ordem === "preco") l.sort((a, b) => a.item.total! - b.item.total!);
    if (ordem === "nota") l.sort((a, b) => (b.item.nota ?? 0) - (a.item.nota ?? 0));
    if (ordem === "local") l.sort((a, b) => (b.item.notaLocal ?? -1) - (a.item.notaLocal ?? -1));
    if (ordem === "perto") l.sort((a, b) => (distancias.get(a.item.id) ?? Infinity) - (distancias.get(b.item.id) ?? Infinity));
    return l;
  }, [ranqueados, ordem, distancias]);

  function escolherNoMapa(id: string) {
    setSelecionado(id);
    document.getElementById(`hotel-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function verNoMapa(id: string) {
    setSelecionado(id);
    const r = areaMapa.current?.getBoundingClientRect();
    if (r && (r.bottom < 0 || r.top > window.innerHeight)) areaMapa.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function marcar(p: Ponto) {
    setReferencia(p);
    setMarcando(false);
    setOrdem("perto");
  }

  const ordens = ORDENS.filter((o) => o.id !== "perto" || referencia);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,44%)]">
      <div ref={areaMapa} className="flex flex-col gap-2 lg:sticky lg:top-6 lg:order-2">
        <div className="h-[320px] lg:h-[calc(100vh-150px)] lg:min-h-[420px]">
          {pontos.length > 0 ? (
            <MapaHoteis pontos={pontos} selecionado={selecionado} referencia={referencia} marcando={marcando} aoSelecionar={escolherNoMapa} aoMarcar={marcar} />
          ) : (
            <p className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-campo bg-white/60 px-6 text-center text-sm text-suave">
              A fonte não trouxe a localização destas opções.
            </p>
          )}
        </div>
        {pontos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <button
              type="button"
              onClick={() => setMarcando((m) => !m)}
              aria-pressed={marcando}
              className={cx(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 font-medium",
                marcando ? "border-ocre bg-aviso-fundo text-aviso" : "border-campo bg-white text-tinta hover:bg-areia",
              )}
            >
              <span aria-hidden="true">★</span> {marcando ? "Toque no mapa para marcar" : referencia ? "Mudar ponto de referência" : "Marcar ponto de referência"}
            </button>
            {referencia && (
              <button type="button" onClick={() => { setReferencia(null); if (ordem === "perto") setOrdem("melhor"); }} className="h-9 cursor-pointer rounded-[10px] px-2 text-suave hover:text-tinta">
                Limpar ponto
              </button>
            )}
            <span className="text-suave">
              {referencia ? "Distâncias em linha reta até a estrela." : "Marque o evento, a praia ou o escritório para ver a distância de cada hotel."}
              {semLocal > 0 ? ` ${semLocal} sem localização na fonte.` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:order-1">
        <nav aria-label="Ordenar" className={cx("grid gap-2", ordens.length === 5 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")}>
          {ordens.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOrdem(o.id)}
              aria-pressed={ordem === o.id}
              className={cx(
                "flex h-11 cursor-pointer items-center justify-center rounded-[14px] border px-2 text-[13px] font-semibold",
                ordem === o.id ? "border-noite bg-noite text-creme" : "border-borda bg-white text-tinta hover:bg-areia",
              )}
            >
              {o.rotulo}
            </button>
          ))}
        </nav>

        {lista.map(({ item: h, nota, motivos }) => {
          const link = linkSeguro(h.link) ?? linkSeguro(h.ofertas.find((o) => o.link)?.link);
          const ofertas = [...h.ofertas].filter((o) => o.porNoite !== null).sort((a, b) => a.porNoite! - b.porNoite!);
          const temLocal = coordenadaValida(h.lat, h.lon);
          const dist = distancias.get(h.id);
          const local = h.notaLocal !== null ? rotuloLocal(h.notaLocal) : null;
          return (
            <article
              key={h.id}
              id={`hotel-${h.id}`}
              onMouseEnter={() => temLocal && setSelecionado(h.id)}
              className={cx(
                "flex scroll-mt-6 flex-wrap gap-4 rounded-[20px] border bg-white p-4 transition-shadow",
                h.id === melhorId ? "border-[1.5px] border-terracota shadow-[0_18px_40px_-28px_rgba(168,76,42,0.55)]" : "border-borda",
                selecionado === h.id && "ring-2 ring-noite/70",
              )}
            >
              {h.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.foto} alt={`Foto de ${h.nome}`} className="h-[140px] w-full rounded-[14px] object-cover sm:w-[170px]" />
              ) : (
                <div aria-hidden="true" className="flex h-[140px] w-full items-center justify-center rounded-[14px] bg-areia text-suave sm:w-[170px]">
                  <Icone nome="cama" tamanho={28} />
                </div>
              )}
              <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {h.id === melhorId && <Etiqueta cor="forte">Melhor escolha</Etiqueta>}
                  <Etiqueta cor={h.temporada ? "terracota" : "neutra"}>{h.temporada ? "Temporada" : h.estrelas ? `Hotel ${h.estrelas}★` : h.tipo}</Etiqueta>
                  {local && <Etiqueta cor={local.cor}>{local.texto}</Etiqueta>}
                </div>
                <h3 className="font-serif text-[21px] leading-tight">{h.nome}</h3>
                {h.nota !== null && (
                  <span className="text-sm">
                    <strong className="font-semibold">{virgula(h.nota)}</strong>
                    <span className="text-suave"> de 5{h.avaliacoes ? ` · ${h.avaliacoes} avaliações` : ""}</span>
                  </span>
                )}
                {dist !== undefined && (
                  <span className="text-sm font-medium text-aviso">
                    <span aria-hidden="true">★ </span>a {textoDistancia(dist)} do ponto marcado{dist < 4000 ? ` · cerca de ${minutosAPe(dist)} min a pé` : ""}
                  </span>
                )}
                {h.perto.length > 0 && (
                  <span className="text-[13px] text-suave">Perto: {h.perto.map((l) => (l.como ? `${l.nome} (${l.como})` : l.nome)).join(" · ")}</span>
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
              <div className="flex flex-[1_1_100%] flex-wrap items-end justify-between gap-3 border-t border-realce pt-3">
                <div className="flex flex-col">
                  <strong className="font-serif text-[26px] font-medium">{brl(h.total)}</strong>
                  <span className="text-[13px] text-suave">
                    {noites} {noites === 1 ? "noite" : "noites"}
                    {h.porNoite ? ` · ${brl(h.porNoite)}/noite` : ""} · nota {virgula(nota)}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {temLocal && (
                      <button type="button" onClick={() => verNoMapa(h.id)} className="cursor-pointer text-terracota hover:text-terracota-escuro">
                        Ver no mapa
                      </button>
                    )}
                    {temLocal && (
                      <a href={linkMapa(h.lat!, h.lon!)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                        Google Maps <Icone nome="link" tamanho={13} />
                      </a>
                    )}
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                        Ver no site <Icone nome="link" tamanho={13} />
                      </a>
                    )}
                  </span>
                </div>
                <AdicionarABusca
                  viagemId={viagemId}
                  viagens={viagens}
                  exemplo={exemplo}
                  campos={{
                    tipo: "hospedagem",
                    titulo: h.nome,
                    descricao: descricaoHospedagem(h, noites),
                    data: busca.entrada,
                    data_fim: busca.saida,
                    local: busca.destino,
                    preco: h.total,
                    link_compra: link,
                    fonte: "Google Hotels via SerpApi",
                    consultado_em: consultadoEm,
                    dados: JSON.stringify(h),
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
