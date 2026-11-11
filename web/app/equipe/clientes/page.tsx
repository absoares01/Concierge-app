import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarCliente } from "../acoes";
import { AreaTexto, Campo, Cartao, Etiqueta, Subtitulo, Titulo, Vazio } from "@/components/ui";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { RemoverCliente } from "@/components/RemoverCliente";

export default async function Clientes() {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("id, nome, email, telefone, user_id, viagens(count)").order("nome");
  const clientes = (data ?? []) as unknown as {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    user_id: string | null;
    viagens: { count: number }[];
  }[];

  return (
    <>
      <Titulo sobretitulo="quem viaja com a gente">Clientes</Titulo>

      <div className="flex flex-wrap items-start gap-6">
        <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-2.5" aria-label="Lista de clientes">
          {clientes.length === 0 ? (
            <Vazio>Nenhum cliente cadastrado ainda.</Vazio>
          ) : (
            clientes.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-[18px] border border-borda bg-white py-2 pl-2 pr-3 hover:border-terracota">
                <Link
                  href={`/equipe/clientes/${c.id}`}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] px-3 py-2 text-tinta no-underline hover:text-tinta"
                >
                  <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-realce font-semibold uppercase text-terracota">
                    {c.nome.slice(0, 2)}
                  </span>
                  <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                    <strong className="font-semibold">{c.nome}</strong>
                    <span className="truncate text-sm text-suave">{[c.email, c.telefone].filter(Boolean).join(" · ") || "sem contato"}</span>
                  </span>
                  <span className="text-sm text-suave">
                    {c.viagens?.[0]?.count ?? 0} {(c.viagens?.[0]?.count ?? 0) === 1 ? "viagem" : "viagens"}
                  </span>
                  <Etiqueta cor={c.user_id ? "verde" : "neutra"}>{c.user_id ? "Acesso liberado" : "Sem acesso"}</Etiqueta>
                </Link>
                <RemoverCliente clienteId={c.id} nome={c.nome} viagens={c.viagens?.[0]?.count ?? 0} compacto />
              </div>
            ))
          )}
        </section>

        <Cartao className="flex-[1_1_300px]">
          <form action={criarCliente} className="flex flex-col gap-4">
            <Subtitulo>Novo cliente</Subtitulo>
            <Campo rotulo="Nome" id="nome" required />
            <Campo rotulo="E-mail (para o acesso)" id="email" type="email" />
            <Campo rotulo="Telefone / WhatsApp" id="telefone" />
            <AreaTexto rotulo="Notas internas (o cliente não vê)" id="notas_internas" placeholder="Preferências, restrições, como nos conheceu…" />
            <BotaoEnviar enviando="Cadastrando…">Cadastrar cliente</BotaoEnviar>
          </form>
        </Cartao>
      </div>
    </>
  );
}
