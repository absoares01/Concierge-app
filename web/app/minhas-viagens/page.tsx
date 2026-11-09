import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { lerSessao } from "@/lib/auth";
import { periodo } from "@/lib/format";
import type { Viagem } from "@/lib/types";
import { Etiqueta, Vazio } from "@/components/ui";

export default async function MinhasViagens() {
  const sessao = await lerSessao();
  const supabase = await createClient();
  // As regras do banco já filtram: o cliente só recebe as próprias viagens publicadas.
  const { data } = await supabase
    .from("viagens")
    .select("*")
    .in("status", ["publicada", "concluida"])
    .order("data_ida", { ascending: true, nullsFirst: false });
  const viagens = (data ?? []) as Viagem[];
  const nome = sessao?.perfil.nome?.split(" ")[0];

  return (
    <>
      <header className="flex flex-col gap-1">
        <span className="font-script text-[30px] leading-none text-terracota">para onde vamos?</span>
        <h1 className="font-serif text-4xl tracking-[-0.5px] md:text-[44px]">{nome ? `Olá, ${nome}.` : "Suas viagens"}</h1>
      </header>

      {viagens.length === 0 ? (
        <Vazio>Sua consultora ainda está preparando sua viagem. Assim que estiver pronta, ela aparece aqui.</Vazio>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {viagens.map((v) => (
            <Link key={v.id} href={`/minhas-viagens/${v.id}`} className="flex flex-col gap-3 rounded-[24px] bg-noite p-6 text-creme no-underline hover:text-creme hover:opacity-95">
              <span className="font-script text-2xl text-terracota-claro">{periodo(v.data_ida, v.data_volta)}</span>
              <strong className="font-serif text-[28px] font-normal leading-tight">{v.titulo}</strong>
              <span className="text-sm text-[#D9CCBD]">{[v.destino, v.viajantes].filter(Boolean).join(" · ")}</span>
              <Etiqueta cor={v.status === "concluida" ? "neutra" : "terracota"} className="self-start">
                {v.status === "concluida" ? "Concluída" : "Ver planejamento"}
              </Etiqueta>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
