import Link from "next/link";
import { Cartao, Marca } from "@/components/ui";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <Marca />
      <Cartao className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl">Página não encontrada</h1>
        <p className="text-suave">Ela pode ter sido removida, ou você não tem acesso a ela.</p>
        <Link href="/">Voltar ao início</Link>
      </Cartao>
    </main>
  );
}
