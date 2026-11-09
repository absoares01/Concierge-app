import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarCliente } from "../acoes";
import { AreaTexto, Botao, Campo, Cartao, Etiqueta, Subtitulo, Titulo, Vazio } from "@/components/ui";

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
              <Link
                key={c.id}
                href={`/equipe/clientes/${c.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] border border-borda bg-white px-5 py-4 text-tinta no-underline hover:border-terracota hover:text-tinta"
              >
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-realce font-semibold uppercase text-terracota">
                  {c.nome.slice(0, 2)}
                </span>
                <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <strong className="font-semibold">{c.nome}</strong>
                  <span className="truncate text-sm text-suave">{[c.email, c.telefone].filter(Boolean).join(" · ") || "sem contato"}</span>
                </span>
                <span className="text-sm text-suave">
                  {c.viagens?.[0]?.count ?? 0} {(c.viagens?.[0]?.count ?? 0) === 1 ? "viagem" : "viagens"}
                </span>
                <Etiqueta cor={c.user_id ? "verde" : "neutra"}>{c.user_id ? "Acesso liberado" : "Sem acesso"}</Etiqueta>
              </Link>
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
            <Botao type="submit">Cadastrar cliente</Botao>
          </form>
        </Cartao>
      </div>
    </>
  );
}
