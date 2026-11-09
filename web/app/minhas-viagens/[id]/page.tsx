import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerSessao } from "@/lib/auth";
import { ROTULO_TIPO, brl, dataComDia, num, periodo, quando } from "@/lib/format";
import { agruparPorDia, calcularOrcamento } from "@/lib/orcamento";
import { linkSeguro } from "@/lib/validar";
import type { ItemChecklist, ItemViagem, Viagem } from "@/lib/types";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Cartao, Etiqueta, Icone, Subtitulo } from "@/components/ui";

const corSituacao = { sugestao: "neutra", recomendado: "forte", reservado: "verde" } as const;
const rotuloSituacao = { sugestao: "Opção", recomendado: "Recomendado", reservado: "Reservado" } as const;
const marcaChecklist = { ok: { s: "✓", c: "text-salvia" }, pendente: { s: "○", c: "text-suave" }, atencao: { s: "!", c: "text-aviso" } } as const;

function CartaoItem({ i }: { i: ItemViagem }) {
  const link = linkSeguro(i.link_compra);
  return (
    <article className={"flex flex-col gap-3 rounded-[20px] border bg-white px-5 py-4 " + (i.situacao === "recomendado" ? "border-[1.5px] border-terracota" : "border-borda")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
          <Etiqueta cor={corSituacao[i.situacao]} className="self-start">
            {rotuloSituacao[i.situacao]}
          </Etiqueta>
          <h3 className="font-serif text-[21px]">{i.titulo}</h3>
          <span className="text-sm text-suave">
            {[i.data && dataComDia(i.data), i.hora, i.data_fim && `até ${dataComDia(i.data_fim)}`, i.local].filter(Boolean).join(" · ")}
          </span>
          {i.descricao && <p className="whitespace-pre-line text-sm leading-relaxed">{i.descricao}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          {i.milhas ? (
            <>
              <strong className="font-serif text-[22px] font-medium">{num(i.milhas)} milhas</strong>
              <span className="text-[13px] text-suave">
                {i.programa}
                {i.taxas ? ` + ${brl(i.taxas)} de taxas` : ""}
              </span>
            </>
          ) : null}
          {i.preco !== null && <strong className="font-serif text-[22px] font-medium">{brl(i.preco, i.moeda)}</strong>}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="nao-imprimir mt-1 inline-flex h-10 items-center gap-1.5 rounded-[12px] bg-terracota px-4 text-sm font-medium text-white no-underline hover:bg-terracota-escuro hover:text-white"
            >
              {i.situacao === "reservado" ? "Ver reserva" : "Comprar ou reservar"} <Icone nome="link" tamanho={15} />
            </a>
          )}
        </div>
      </div>
      {(i.fonte || i.consultado_em) && (
        <span className="text-xs text-suave">
          {i.fonte}
          {i.consultado_em ? ` · valor consultado ${quando(i.consultado_em)}, pode mudar até a reserva` : ""}
        </span>
      )}
    </article>
  );
}

export default async function ViagemCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await lerSessao();
  const supabase = await createClient();
  // RLS: o cliente só recebe esta viagem se for dele e estiver publicada.
  const { data: viagem } = await supabase.from("viagens").select("*").eq("id", id).maybeSingle<Viagem>();
  if (!viagem) notFound();

  const [{ data: itensData }, { data: checklistData }] = await Promise.all([
    supabase.from("itens_viagem").select("*").eq("viagem_id", id).eq("visivel_cliente", true).order("data", { ascending: true, nullsFirst: false }).order("hora"),
    supabase.from("checklist_viagem").select("*").eq("viagem_id", id).order("ordem").order("criado_em"),
  ]);
  const itens = (itensData ?? []) as ItemViagem[];
  const checklist = (checklistData ?? []) as ItemChecklist[];
  const equipe = sessao?.perfil.papel === "equipe";

  const ordenar = (lista: ItemViagem[]) =>
    [...lista].sort((a, b) => ["reservado", "recomendado", "sugestao"].indexOf(a.situacao) - ["reservado", "recomendado", "sugestao"].indexOf(b.situacao));
  const voos = ordenar(itens.filter((i) => i.tipo === "voo"));
  const hospedagens = ordenar(itens.filter((i) => i.tipo === "hospedagem"));
  const roteiro = agruparPorDia(itens.filter((i) => !(["voo", "hospedagem"] as string[]).includes(i.tipo) || i.situacao !== "sugestao"));
  const semData = itens.filter((i) => !i.data && !(["voo", "hospedagem"] as string[]).includes(i.tipo));
  const orc = calcularOrcamento(itens);
  const pct = viagem.orcamento_teto ? Math.min(100, Math.round((orc.totalDinheiro / viagem.orcamento_teto) * 100)) : null;

  return (
    <>
      {equipe && (
        <p className="nao-imprimir rounded-[14px] bg-aviso-fundo px-4 py-3 text-sm text-aviso">
          <strong>Pré-visualização da equipe:</strong> é assim que o cliente vê.{" "}
          {viagem.status === "rascunho" ? "Esta viagem ainda é rascunho, então o cliente ainda não a vê. " : ""}
          <Link href={`/equipe/viagens/${viagem.id}`}>Voltar para a edição</Link>
        </p>
      )}

      <header className="flex flex-wrap items-end justify-between gap-5 rounded-[24px] bg-noite px-7 py-8 text-creme md:px-9">
        <div className="flex flex-col gap-1.5">
          <span className="font-script text-[28px] text-terracota-claro">{periodo(viagem.data_ida, viagem.data_volta)}</span>
          <h1 className="font-serif text-4xl tracking-[-0.5px] md:text-[46px]">{viagem.titulo}</h1>
          <span className="text-[15px] text-[#D9CCBD]">{[viagem.destino, viagem.viajantes].filter(Boolean).join(" · ")}</span>
        </div>
        <BotaoImprimir />
      </header>

      {viagem.mensagem && (
        <Cartao className="flex flex-col gap-2">
          <span className="font-script text-2xl text-terracota">um recado da sua consultora</span>
          <p className="whitespace-pre-line leading-relaxed">{viagem.mensagem}</p>
        </Cartao>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-8">
          {voos.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="t-voos">
              <Subtitulo>
                <span id="t-voos">Voos</span>
              </Subtitulo>
              {voos.map((i) => (
                <CartaoItem key={i.id} i={i} />
              ))}
            </section>
          )}

          {hospedagens.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="t-hosp">
              <Subtitulo>
                <span id="t-hosp">Hospedagem</span>
              </Subtitulo>
              {hospedagens.map((i) => (
                <CartaoItem key={i.id} i={i} />
              ))}
            </section>
          )}

          {roteiro.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="t-roteiro">
              <Subtitulo>
                <span id="t-roteiro">Roteiro dia a dia</span>
              </Subtitulo>
              {roteiro.map((dia) => (
                <Cartao key={dia.data} className="flex flex-col gap-3">
                  <h3 className="font-serif text-xl">{dataComDia(dia.data)}</h3>
                  {dia.itens.map((i) => {
                    const link = linkSeguro(i.link_compra);
                    return (
                      <div key={i.id} className="flex gap-4">
                        <span className="w-14 shrink-0 font-semibold">{i.hora ?? ""}</span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <strong className="font-semibold">
                            {i.titulo} <span className="text-xs font-normal text-suave">· {ROTULO_TIPO[i.tipo]}</span>
                          </strong>
                          {i.local && <span className="text-sm text-suave">{i.local}</span>}
                          {i.descricao && i.tipo !== "voo" && i.tipo !== "hospedagem" && <p className="whitespace-pre-line text-sm leading-relaxed">{i.descricao}</p>}
                          {link && i.tipo !== "voo" && i.tipo !== "hospedagem" && (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="nao-imprimir text-sm">
                              {i.situacao === "reservado" ? "Ver reserva" : "Reservar"}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Cartao>
              ))}
            </section>
          )}

          {semData.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="t-outros">
              <Subtitulo>
                <span id="t-outros">Outras recomendações</span>
              </Subtitulo>
              {semData.map((i) => (
                <CartaoItem key={i.id} i={i} />
              ))}
            </section>
          )}

          {itens.length === 0 && <p className="text-suave">Sua consultora está montando os detalhes desta viagem.</p>}
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          <Cartao className="flex flex-col gap-3">
            <Subtitulo>Orçamento</Subtitulo>
            {orc.considerados === 0 ? (
              <p className="text-sm text-suave">O total aparece quando a consultora marcar as opções recomendadas.</p>
            ) : (
              <>
                <div className="flex flex-col text-sm">
                  {orc.linhas.map((l) => (
                    <div key={l.tipo} className="flex justify-between gap-3 border-b border-realce py-2">
                      <span>{ROTULO_TIPO[l.tipo]}</span>
                      <span className="text-right">
                        {l.dinheiro ? brl(l.dinheiro) : ""}
                        {l.milhas ? `${l.dinheiro ? " + " : ""}${num(l.milhas)} milhas` : ""}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span className="text-right">
                      {brl(orc.totalDinheiro)}
                      {orc.totalMilhas ? ` + ${num(orc.totalMilhas)} milhas` : ""}
                    </span>
                  </div>
                </div>
                {pct !== null && (
                  <>
                    <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-realce">
                      <div className="h-full rounded-full bg-terracota" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[13px] text-suave">
                      {pct}% do teto de {brl(viagem.orcamento_teto)}
                    </span>
                  </>
                )}
                <span className="text-xs text-suave">
                  Soma das opções recomendadas e reservadas. {orc.pendentes > 0 ? `${orc.pendentes} opção(ões) ainda em análise não entram no total. ` : ""}
                  Taxa de assessoria e gastos do dia a dia à parte.
                </span>
              </>
            )}
          </Cartao>

          {checklist.length > 0 && (
            <Cartao className="flex flex-col gap-3">
              <Subtitulo>Documentos e orientações</Subtitulo>
              {checklist.map((c) => {
                const fonte = linkSeguro(c.fonte_url);
                return (
                  <div key={c.id} className="flex gap-2.5 text-sm leading-relaxed">
                    <span aria-hidden="true" className={"w-4 shrink-0 font-bold " + marcaChecklist[c.estado].c}>
                      {marcaChecklist[c.estado].s}
                    </span>
                    <span>
                      <span className="sr-only">{c.estado === "ok" ? "Concluído: " : c.estado === "atencao" ? "Atenção: " : "Pendente: "}</span>
                      {c.texto}
                      {fonte && (
                        <>
                          {" "}
                          <a href={fonte} target="_blank" rel="noopener noreferrer">
                            (fonte oficial)
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </Cartao>
          )}

          <p className="text-xs leading-relaxed text-suave">
            Preços e disponibilidade de passagens, hospedagens e passeios podem mudar até a confirmação da reserva. Compras são feitas diretamente com cada fornecedor.
          </p>
        </aside>
      </div>
    </>
  );
}
