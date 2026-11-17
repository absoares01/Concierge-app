import Link from "next/link";
import { buscarOfertas, buscarVoltas } from "@/lib/serpapi";
import { riscoDe } from "@/lib/agencias";
import { lerBusca, linkSkyscanner, paramsDaBusca, type Params } from "@/lib/busca-voos";
import { brl, dataComDia, duracao, hora, quando } from "@/lib/format";
import { uuidOuNulo } from "@/lib/validar";
import { dadosDaViagem, viagensAbertas } from "@/lib/viagens-abertas";
import type { BuscaVoos, OfertaVoo, ResultadoOfertas, ResultadoVoltas, Voo } from "@/lib/types";
import { AdicionarABusca } from "@/components/AdicionarABusca";
import { AvisoRisco } from "@/components/AvisoRisco";
import { IrParaSite } from "@/components/IrParaSite";
import { AvisoExemplo, BotaoLink, Cartao, Etiqueta, Icone, Subtitulo, Titulo, Vazio } from "@/components/ui";

// Lista de companhias e agências que vendem um voo, via Google Flights (SerpApi, booking options).
// Cada abertura usa 1 crédito da SerpApi; ida e volta usa 2 (escolher a volta + lista de sites).

// As fichas da SerpApi são longas e opacas; só aceitamos caracteres de base64.
function ficha(v: string | undefined): string | null {
  return v && /^[A-Za-z0-9_\-=+/.]{8,4000}$/.test(v) ? v : null;
}

function resumoVoo(v: Voo): string {
  const escalas = v.escalas === 0 ? "direto" : `${v.escalas} ${v.escalas === 1 ? "escala" : "escalas"}${v.conexoes.length ? ` (${v.conexoes.map((c) => c.aeroporto).join(", ")})` : ""}`;
  return `${v.companhias.join(", ")} · ${v.origem} ${hora(v.partida)} → ${v.destino} ${hora(v.chegada)} · ${duracao(v.duracaoMin)} · ${escalas}`;
}

function semFichas(v: Voo): Voo {
  const { tokenIda: _i, tokenReserva: _r, ...resto } = v;
  return resto;
}

function descricaoOferta(o: OfertaVoo, voos: Voo[], q: BuscaVoos): string {
  const linhas = voos.map((v, i) => `${voos.length > 1 ? (i === 0 ? "Ida" : "Volta") : "Voo"} ${dataComDia(v.partida)}: ${resumoVoo(v)}`);
  linhas.push(`Vendido por: ${o.vendedor}${o.ehCompanhia ? " (companhia aérea)" : " (agência)"}${o.tarifa ? ` · tarifa ${o.tarifa}` : ""}`);
  if (o.bagagem.length) linhas.push(`Bagagem: ${o.bagagem.join(" · ")}`);
  if (o.condicoes.length) linhas.push(`Condições: ${o.condicoes.join(" · ")}`);
  if (o.separado) linhas.push("Ida e volta em bilhetes separados.");
  linhas.push(`Preço total para ${q.adultos} ${q.adultos === 1 ? "adulto" : "adultos"}${q.volta ? ", ida e volta" : ""}.`);
  return linhas.join("\n");
}

export default async function OfertasVoo({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const busca = lerBusca(p);
  const reserva = ficha(p.reserva);
  const tokenIda = ficha(p.ida_token);
  const [viagem, viagens] = await Promise.all([dadosDaViagem(uuidOuNulo(p.viagem)), viagensAbertas()]);
  const viagemId = viagem?.id ?? null;
  const voltar = busca ? `/equipe/buscar/voos?${paramsDaBusca(busca, { viagem: viagemId ?? undefined })}` : "/equipe/buscar/voos";

  let ofertas: ResultadoOfertas | null = null;
  let voltas: ResultadoVoltas | null = null;
  let erro: string | null = null;
  if (busca && (reserva || tokenIda)) {
    try {
      if (reserva) ofertas = await buscarOfertas(busca, reserva);
      else if (tokenIda) voltas = await buscarVoltas(busca, tokenIda);
    } catch (e) {
      erro = (e as Error).message;
    }
  }

  return (
    <>
      <Titulo sobretitulo={viagem ? `para ${viagem.rotulo}` : "onde comprar"} acoes={<BotaoLink href={voltar} variante="secundario">Voltar à busca</BotaoLink>}>
        {voltas ? "Escolha a volta" : "Sites que vendem este voo"}
      </Titulo>

      {!busca || (!reserva && !tokenIda) ? (
        <Vazio>
          Abra esta tela pelo botão “Ver todos os sites” de um voo na <Link href="/equipe/buscar/voos">busca de voos</Link>.
        </Vazio>
      ) : null}

      {erro && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-erro">
          Não foi possível buscar agora. {erro} Se a busca foi feita há muito tempo, volte e busque de novo: as fichas do Google expiram.
        </p>
      )}

      {(ofertas?.exemplo || voltas?.exemplo) && <AvisoExemplo />}

      {voltas && busca && (
        <section className="flex flex-col gap-3" aria-label="Voltas">
          <p className="text-sm text-suave">
            Para ida e volta, o Google pede a volta antes de listar os sites. Os preços abaixo já são o total da viagem. Consultado {quando(voltas.consultadoEm)}.
          </p>
          {voltas.voltas.length === 0 && <Vazio>Nenhuma volta encontrada para esta ida. Volte e escolha outro voo.</Vazio>}
          {voltas.voltas.map((v) => (
            <article key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-borda bg-white px-5 py-4">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
                <strong className="font-semibold">
                  {dataComDia(v.partida)} · {hora(v.partida)} {v.origem} → {hora(v.chegada)} {v.destino}
                </strong>
                <span className="text-sm text-suave">{resumoVoo(v)}</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <strong className="font-serif text-2xl font-medium">{brl(v.preco)}</strong>
                {v.tokenReserva ? (
                  <BotaoLink href={`/equipe/buscar/voos/ofertas?${paramsDaBusca(busca, { viagem: viagemId ?? undefined, reserva: v.tokenReserva })}`} className="h-10 text-[13px]">
                    Ver sites desta combinação
                  </BotaoLink>
                ) : (
                  <span className="text-xs text-suave">Sem lista de sites para esta volta.</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {ofertas && busca && (
        <>
          {ofertas.selecionados.length > 0 && (
            <Cartao className="flex flex-col gap-2">
              <Subtitulo>Voo escolhido</Subtitulo>
              {ofertas.selecionados.map((v, i) => (
                <p key={v.id} className="text-sm">
                  <strong className="font-semibold">{ofertas!.selecionados.length > 1 ? (i === 0 ? "Ida" : "Volta") : "Voo"}</strong> {dataComDia(v.partida)}: {resumoVoo(v)}
                </p>
              ))}
            </Cartao>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-suave">
            <span>
              {ofertas.ofertas.length} {ofertas.ofertas.length === 1 ? "site" : "sites"} · consultado {quando(ofertas.consultadoEm)} · preço total, {busca.adultos}{" "}
              {busca.adultos === 1 ? "adulto" : "adultos"}
            </span>
            <a href={linkSkyscanner(busca)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
              Comparar no Skyscanner <Icone nome="link" tamanho={14} />
            </a>
          </div>

          {ofertas.ofertas.length === 0 && (
            <Vazio>O Google não listou sites para este voo. Tente o Skyscanner pelo link acima ou compre direto com a companhia.</Vazio>
          )}

          <section className="flex flex-col gap-3" aria-label="Sites">
            {ofertas.ofertas.map((o, k) => {
              const risco = riscoDe(o.vendedor);
              const menor = k === 0 && o.preco !== null;
              return (
                <article key={`${o.vendedor}-${k}`} className={"flex flex-col gap-3 rounded-[18px] border bg-white px-5 py-4 " + (menor ? "border-terracota" : "border-borda")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-[1_1_300px] items-start gap-3">
                      {o.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.logo} alt="" className="h-10 w-10 rounded-[10px] bg-areia object-contain p-1" />
                      ) : (
                        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-areia text-xs font-semibold text-suave">
                          {o.vendedor.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="font-semibold">{o.vendedor}</strong>
                          <Etiqueta cor={o.ehCompanhia ? "verde" : "neutra"}>{o.ehCompanhia ? "Companhia aérea" : "Agência"}</Etiqueta>
                          {menor && <Etiqueta cor="forte">Menor preço</Etiqueta>}
                          {o.separado && <Etiqueta cor="aviso">Bilhetes separados</Etiqueta>}
                          {risco && <Etiqueta cor="aviso">Emitida com milhas</Etiqueta>}
                        </div>
                        {o.tarifa && <span className="text-sm text-suave">Tarifa: {o.tarifa}</span>}
                        {o.bagagem.length > 0 && <span className="text-sm text-suave">Bagagem: {o.bagagem.join(" · ")}</span>}
                        {o.condicoes.length > 0 && <span className="text-xs text-suave">{o.condicoes.join(" · ")}</span>}
                        {o.telefone && <span className="text-xs text-suave">Telefone: {o.telefone}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <strong className="font-serif text-[26px] font-medium">{brl(o.preco)}</strong>
                      <div className="flex flex-wrap justify-end gap-2">
                        {o.links.map((l, i) => (
                          <IrParaSite key={i} link={l} principal={i === 0} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {risco && <AvisoRisco risco={risco} para="equipe" />}
                  <div className="flex justify-end border-t border-realce pt-3">
                    <AdicionarABusca
                      viagemId={viagemId}
                      viagens={viagens}
                      exemplo={ofertas!.exemplo}
                      campos={{
                        tipo: "voo",
                        titulo: `${ofertas!.selecionados[0]?.companhias.join(", ") || "Voo"} · ${busca.origem} → ${busca.destino}${busca.volta ? " (ida e volta)" : ""} · ${o.vendedor}`,
                        descricao: descricaoOferta(o, ofertas!.selecionados, busca),
                        data: busca.ida,
                        hora: ofertas!.selecionados[0] ? hora(ofertas!.selecionados[0].partida) : null,
                        data_fim: busca.volta ?? null,
                        local: `${busca.origem} → ${busca.destino}`,
                        preco: o.preco,
                        link_compra: ofertas!.linkGoogle ?? null,
                        fonte: `${o.vendedor} via Google Flights`,
                        consultado_em: ofertas!.consultadoEm,
                        dados: JSON.stringify({
                          voos: ofertas!.selecionados.map(semFichas),
                          oferta: { vendedor: o.vendedor, ehCompanhia: o.ehCompanhia, preco: o.preco, tarifa: o.tarifa, bagagem: o.bagagem, condicoes: o.condicoes, separado: o.separado },
                        }),
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </section>

          <p className="text-xs text-suave">
            Os preços e a lista de sites vêm do Google Flights. Algumas agências (como as que vendem passagens com milhas) não aparecem no Google: para elas, use o Skyscanner pelo link acima. O
            link guardado na viagem abre o voo no Google Flights, porque o endereço direto do site expira.
          </p>
        </>
      )}
    </>
  );
}
