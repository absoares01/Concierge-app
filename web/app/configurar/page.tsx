import { Cartao, Marca } from "@/components/ui";

export default function Configurar() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <Marca />
      <Cartao className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl">Falta conectar o banco de dados</h1>
        <p className="leading-relaxed text-suave">
          O app precisa do Supabase para login, clientes e viagens. Cadastre as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code> (veja <code>web/README.md</code>) e publique de novo.
        </p>
      </Cartao>
    </main>
  );
}
