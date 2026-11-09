import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temChaveSerpApi } from "@/lib/serpapi";
import { ROTULO_PACOTE, ROTULO_STATUS, periodo, quando } from "@/lib/format";
import { BotaoLink, Cartao, Etiqueta, Icone, Subtitulo, Titulo, Vazio } from "@/components/ui";

const corStatus = { rascunho: "aviso", publicada: "verde", concluida: "neutra" } as const;

export default async function PainelEquipe() {
  const supabase = await createClient();
  const [{ data: viagens }, { count: totalClientes }] = await Promise.all([
    supabase
      .from("viagens")
      .select("id, titulo, destino, data_ida, data_volta, status, pacote, atualizado_em, clientes(nome)")
      .order("atualizado_em", { ascending: false })
      .limit(12),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
  ]);

  const lista = (viagens ?? []) as unknown as {
    id: string;
    titulo: string;
    destino: string | null;
    data_ida: string | null;
    data_volta: string | null;
    status: keyof typeof corStatus;
    pacote: string | null;
    atualizado_em: string;
    clientes: { nome: string } | null;
  }[];
  const rascunhos = lista.filter((v) => v.status === "rascunho").length;
  const publicadas = lista.filter((v) => v.status === "publicada").length;

  return (
    <>
      <Titulo
        sobretitulo="bom trabalho por aqui"
        acoes={
          <>
            <BotaoLink href="/equipe/buscar/voos" variante="secundario">
              <Icone nome="voo" tamanho={18} /> Buscar voos
            </BotaoLink>
            <BotaoLink href="/equipe/clientes">
              <Icone nome="mais" tamanho={18} /> Novo cliente
            </BotaoLink>
          </>
        }
      >
        Painel
      </Titulo>

      {!temChaveSerpApi() && (
        <p className="rounded-[14px] bg-aviso-fundo px-4 py-3 text-sm text-aviso">
          As buscas estão em <strong>modo exemplo</strong>: cadastre a <code>SERPAPI_KEY</code> para pesquisar preços reais.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Cartao className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Clientes</span>
          <strong className="font-serif text-4xl font-normal">{totalClientes ?? 0}</strong>
        </Cartao>
        <Cartao className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Em planejamento</span>
          <strong className="font-serif text-4xl font-normal">{rascunhos}</strong>
        </Cartao>
        <Cartao className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Publicadas ao cliente</span>
          <strong className="font-serif text-4xl font-normal">{publicadas}</strong>
        </Cartao>
      </div>

      <section className="flex flex-col gap-3">
        <Subtitulo>Viagens recentes</Subtitulo>
        {lista.length === 0 ? (
          <Vazio>
            Nenhuma viagem ainda. Comece <Link href="/equipe/clientes">cadastrando um cliente</Link> e criando a viagem dele.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-2.5">
            {lista.map((v) => (
              <Link
                key={v.id}
                href={`/equipe/viagens/${v.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] border border-borda bg-white px-5 py-4 text-tinta no-underline hover:border-terracota hover:text-tinta"
              >
                <span className="flex min-w-0 flex-[1_1_260px] flex-col">
                  <strong className="font-semibold">{v.titulo}</strong>
                  <span className="text-sm text-suave">
                    {v.clientes?.nome ?? "—"} · {v.destino ?? "destino a definir"} · {periodo(v.data_ida, v.data_volta)}
                  </span>
                </span>
                {v.pacote && <Etiqueta>{ROTULO_PACOTE[v.pacote]}</Etiqueta>}
                <Etiqueta cor={corStatus[v.status]}>{ROTULO_STATUS[v.status]}</Etiqueta>
                <span className="text-xs text-suave">atualizada {quando(v.atualizado_em)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
