import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_PACOTE, ROTULO_SITUACAO, ROTULO_STATUS, ROTULO_TIPO, brl, dataComDia, num, periodo, quando } from "@/lib/format";
import { linkSeguro } from "@/lib/validar";
import type { ItemChecklist, ItemViagem, Viagem } from "@/lib/types";
import {
  adicionarChecklist,
  adicionarItem,
  atualizarItem,
  atualizarViagem,
  excluirChecklist,
  excluirItem,
  excluirViagem,
  mudarChecklist,
  mudarStatusViagem,
} from "../../acoes";
import { CamposViagem } from "@/components/CamposViagem";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { AreaTexto, Botao, BotaoLink, Campo, Cartao, Etiqueta, Icone, Selecao, Subtitulo, Titulo, Vazio } from "@/components/ui";

const ORDEM_TIPOS = ["voo", "hospedagem", "passeio", "transporte", "seguro", "atividade", "outro"] as const;
const corSituacao = { sugestao: "neutra", recomendado: "terracota", reservado: "verde" } as const;
const corStatus = { rascunho: "aviso", publicada: "verde", concluida: "neutra" } as const;
const corChecklist = { ok: "verde", pendente: "neutra", atencao: "aviso" } as const;
const rotuloChecklist = { ok: "Ok", pendente: "Pendente", atencao: "Atenção" } as const;

function BotaoMini({ children, variante = "secundario" }: { children: React.ReactNode; variante?: "secundario" | "perigo" }) {
  return (
    <button
      type="submit"
      className={
        "inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-campo bg-white px-3 text-[13px] hover:bg-areia " +
        (variante === "perigo" ? "text-erro" : "text-tinta")
      }
    >
      {children}
    </button>
  );
}

export default async function EditorViagem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: viagem } = await supabase.from("viagens").select("*, clientes(id, nome, user_id)").eq("id", id).maybeSingle();
  if (!viagem) notFound();
  const v = viagem as Viagem & { clientes: { id: string; nome: string; user_id: string | null } | null };

  const [{ data: itensData }, { data: checklistData }] = await Promise.all([
    supabase.from("itens_viagem").select("*").eq("viagem_id", id).order("data", { ascending: true, nullsFirst: false }).order("hora").order("criado_em"),
    supabase.from("checklist_viagem").select("*").eq("viagem_id", id).order("ordem").order("criado_em"),
  ]);
  const itens = (itensData ?? []) as ItemViagem[];
  const checklist = (checklistData ?? []) as ItemChecklist[];
  const busca = `viagem=${v.id}`;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href={`/equipe/clientes/${v.cliente_id}`} className="text-sm">
          ← {v.clientes?.nome ?? "cliente"}
        </Link>
        <Titulo
          sobretitulo={`${v.destino ?? "destino a definir"} · ${periodo(v.data_ida, v.data_volta)}`}
          acoes={
            <>
              <BotaoLink href={`/minhas-viagens/${v.id}`} variante="secundario">
                Ver como o cliente
              </BotaoLink>
              {v.status !== "publicada" ? (
                <form action={mudarStatusViagem}>
                  <input type="hidden" name="viagem_id" value={v.id} />
                  <input type="hidden" name="status" value="publicada" />
                  <Botao type="submit">Publicar para o cliente</Botao>
                </form>
              ) : (
                <>
                  <form action={mudarStatusViagem}>
                    <input type="hidden" name="viagem_id" value={v.id} />
                    <input type="hidden" name="status" value="rascunho" />
                    <Botao type="submit" variante="secundario">
                      Voltar para rascunho
                    </Botao>
                  </form>
                  <form action={mudarStatusViagem}>
                    <input type="hidden" name="viagem_id" value={v.id} />
                    <input type="hidden" name="status" value="concluida" />
                    <Botao type="submit" variante="escuro">
                      Marcar como concluída
                    </Botao>
                  </form>
                </>
              )}
            </>
          }
        >
          {v.titulo}
        </Titulo>
        <div className="flex flex-wrap items-center gap-2 text-sm text-suave">
          <Etiqueta cor={corStatus[v.status]}>{ROTULO_STATUS[v.status]}</Etiqueta>
          {v.pacote && <Etiqueta>Pacote {ROTULO_PACOTE[v.pacote]}</Etiqueta>}
          {!v.clientes?.user_id && <span>O cliente ainda não tem acesso ao app.</span>}
          {v.status === "rascunho" && <span>Enquanto for rascunho, o cliente não vê esta viagem.</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-6">
          <section id="itens" className="flex flex-col gap-4" aria-label="Itens da viagem">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Subtitulo>Itens da viagem</Subtitulo>
              <div className="flex flex-wrap gap-2">
                <BotaoLink href={`/equipe/buscar/voos?${busca}`} variante="secundario">
                  <Icone nome="voo" tamanho={18} /> Buscar voos
                </BotaoLink>
                <BotaoLink href={`/equipe/buscar/hospedagem?${busca}&destino=${encodeURIComponent(v.destino ?? "")}&entrada=${v.data_ida ?? ""}&saida=${v.data_volta ?? ""}`} variante="secundario">
                  <Icone nome="cama" tamanho={18} /> Buscar hospedagem
                </BotaoLink>
              </div>
            </div>

            {itens.length === 0 && <Vazio>Nada adicionado ainda. Use as buscas ou o formulário abaixo.</Vazio>}

            {ORDEM_TIPOS.filter((t) => itens.some((i) => i.tipo === t)).map((tipo) => (
              <div key={tipo} className="flex flex-col gap-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">{ROTULO_TIPO[tipo]}</h3>
                {itens
                  .filter((i) => i.tipo === tipo)
                  .map((i) => {
                    const link = linkSeguro(i.link_compra);
                    return (
                      <article key={i.id} className={"flex flex-col gap-3 rounded-[18px] border bg-white px-5 py-4 " + (i.situacao === "recomendado" ? "border-terracota" : "border-borda")}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="font-semibold">{i.titulo}</strong>
                              <Etiqueta cor={corSituacao[i.situacao]}>{ROTULO_SITUACAO[i.situacao]}</Etiqueta>
                              {!i.visivel_cliente && <Etiqueta cor="escura">Oculto do cliente</Etiqueta>}
                            </div>
                            <span className="text-sm text-suave">
                              {[i.data && dataComDia(i.data), i.hora, i.data_fim && `até ${dataComDia(i.data_fim)}`, i.local].filter(Boolean).join(" · ")}
                            </span>
                            {i.descricao && <p className="whitespace-pre-line text-sm leading-relaxed">{i.descricao}</p>}
                            <span className="text-xs text-suave">
                              {i.fonte ?? "fonte não informada"}
                              {i.consultado_em ? ` · consultado ${quando(i.consultado_em)}` : ""}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 text-right">
                            {i.milhas ? (
                              <>
                                <strong className="font-serif text-xl font-medium">{num(i.milhas)} milhas</strong>
                                <span className="text-xs text-suave">
                                  {i.programa ?? "programa a informar"}
                                  {i.taxas ? ` + ${brl(i.taxas)} de taxas` : ""}
                                </span>
                              </>
                            ) : null}
                            {i.preco !== null && <strong className="font-serif text-xl font-medium">{brl(i.preco, i.moeda)}</strong>}
                            {link && (
                              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm">
                                Abrir link <Icone nome="link" tamanho={14} />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-realce pt-3">
                          {(["sugestao", "recomendado", "reservado"] as const)
                            .filter((s) => s !== i.situacao)
                            .map((s) => (
                              <form key={s} action={atualizarItem}>
                                <input type="hidden" name="item_id" value={i.id} />
                                <input type="hidden" name="viagem_id" value={v.id} />
                                <input type="hidden" name="situacao" value={s} />
                                <BotaoMini>{s === "sugestao" ? "Voltar a sugestão" : s === "recomendado" ? "Recomendar" : "Marcar reservado"}</BotaoMini>
                              </form>
                            ))}
                          <form action={atualizarItem}>
                            <input type="hidden" name="item_id" value={i.id} />
                            <input type="hidden" name="viagem_id" value={v.id} />
                            <input type="hidden" name="visivel" value={i.visivel_cliente ? "nao" : "sim"} />
                            <BotaoMini>{i.visivel_cliente ? "Ocultar do cliente" : "Mostrar ao cliente"}</BotaoMini>
                          </form>
                          <form action={excluirItem} className="ml-auto">
                            <input type="hidden" name="item_id" value={i.id} />
                            <input type="hidden" name="viagem_id" value={v.id} />
                            <BotaoMini variante="perigo">Excluir</BotaoMini>
                          </form>
                        </div>
                      </article>
                    );
                  })}
              </div>
            ))}
          </section>

          <Cartao>
            <form action={adicionarItem} className="flex flex-col gap-4">
              <input type="hidden" name="viagem_id" value={v.id} />
              <div className="flex flex-col gap-1">
                <Subtitulo>Adicionar item manualmente</Subtitulo>
                <p className="text-sm text-suave">
                  Para cotações feitas fora do app: milhas (Smiles, LATAM Pass, Azul Fidelidade), Airbnb, passeios, trens, seguro, atividades do roteiro.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
                <Selecao rotulo="Tipo" id="tipo" defaultValue="atividade">
                  {ORDEM_TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {ROTULO_TIPO[t]}
                    </option>
                  ))}
                </Selecao>
                <Campo rotulo="Título" id="titulo" required placeholder="Ex.: Palácio da Pena" className="col-span-full md:col-span-2" />
                <Campo rotulo="Data" id="data" type="date" />
                <Campo rotulo="Hora" id="hora" type="time" />
                <Campo rotulo="Até (data)" id="data_fim" type="date" />
                <Campo rotulo="Local" id="local" />
                <Campo rotulo="Preço total (R$)" id="preco" inputMode="decimal" />
                <Campo rotulo="Milhas" id="milhas" inputMode="numeric" />
                <Campo rotulo="Programa" id="programa" placeholder="Ex.: LATAM Pass" />
                <Campo rotulo="Taxas da emissão (R$)" id="taxas" inputMode="decimal" />
                <Campo rotulo="Link de compra ou reserva" id="link_compra" type="url" placeholder="https://" className="col-span-full md:col-span-2" />
                <Campo rotulo="Fonte" id="fonte" placeholder="Ex.: site da LATAM, cotação de 08/11" />
                <Selecao rotulo="Situação" id="situacao" defaultValue="sugestao">
                  <option value="sugestao">Sugestão</option>
                  <option value="recomendado">Recomendado</option>
                  <option value="reservado">Reservado</option>
                </Selecao>
                <AreaTexto rotulo="Descrição para o cliente" id="descricao" className="col-span-full" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="visivel_cliente" defaultChecked className="h-[18px] w-[18px] accent-terracota" />
                Mostrar ao cliente
              </label>
              <BotaoEnviar className="self-start" enviando="Adicionando…">
                Adicionar item
              </BotaoEnviar>
            </form>
          </Cartao>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <Cartao className="flex flex-col gap-3">
            <Subtitulo>Documentos e orientações</Subtitulo>
            {checklist.length === 0 && <p className="text-sm text-suave">Passaporte, visto, vacinas, seguro… com a fonte oficial de cada regra.</p>}
            {checklist.map((c) => {
              const fonte = linkSeguro(c.fonte_url);
              return (
                <div key={c.id} className="flex flex-col gap-2 border-b border-realce pb-3 last:border-0">
                  <div className="flex items-start gap-2">
                    <Etiqueta cor={corChecklist[c.estado]}>{rotuloChecklist[c.estado]}</Etiqueta>
                    <span className="flex-1 text-sm leading-relaxed">
                      {c.texto}
                      {fonte && (
                        <>
                          {" "}
                          <a href={fonte} target="_blank" rel="noopener noreferrer">
                            (fonte)
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["ok", "pendente", "atencao"] as const)
                      .filter((e) => e !== c.estado)
                      .map((e) => (
                        <form key={e} action={mudarChecklist}>
                          <input type="hidden" name="item_id" value={c.id} />
                          <input type="hidden" name="viagem_id" value={v.id} />
                          <input type="hidden" name="estado" value={e} />
                          <BotaoMini>{rotuloChecklist[e]}</BotaoMini>
                        </form>
                      ))}
                    <form action={excluirChecklist} className="ml-auto">
                      <input type="hidden" name="item_id" value={c.id} />
                      <input type="hidden" name="viagem_id" value={v.id} />
                      <BotaoMini variante="perigo">Excluir</BotaoMini>
                    </form>
                  </div>
                </div>
              );
            })}
            <form action={adicionarChecklist} className="flex flex-col gap-3 border-t border-borda pt-3">
              <input type="hidden" name="viagem_id" value={v.id} />
              <Campo rotulo="Novo item" id="texto" required placeholder="Ex.: Passaporte válido por 3 meses após a volta" />
              <Campo rotulo="Fonte oficial (link)" id="fonte_url" type="url" placeholder="https://" />
              <Selecao rotulo="Estado" id="estado" defaultValue="pendente">
                <option value="pendente">Pendente</option>
                <option value="atencao">Atenção</option>
                <option value="ok">Ok</option>
              </Selecao>
              <BotaoEnviar variante="secundario" enviando="Adicionando…">
                Adicionar ao checklist
              </BotaoEnviar>
            </form>
          </Cartao>

          <Cartao>
            <form action={atualizarViagem} className="flex flex-col gap-4">
              <input type="hidden" name="viagem_id" value={v.id} />
              <Subtitulo>Dados da viagem</Subtitulo>
              <CamposViagem v={v} />
              <BotaoEnviar variante="secundario">Salvar dados</BotaoEnviar>
            </form>
          </Cartao>

          <Cartao className="flex flex-col gap-3">
            <form action={excluirViagem} className="flex flex-col gap-3">
              <input type="hidden" name="viagem_id" value={v.id} />
              <input type="hidden" name="cliente_id" value={v.cliente_id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirmar" value="sim" required className="h-[18px] w-[18px] accent-terracota" />
                Excluir esta viagem e todos os itens (não dá para desfazer)
              </label>
              <Botao type="submit" variante="perigo">
                Excluir viagem
              </Botao>
            </form>
          </Cartao>
        </div>
      </div>
    </>
  );
}
