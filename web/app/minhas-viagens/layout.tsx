import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { Icone, Marca } from "@/components/ui";

export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const sessao = await exigirLogin();
  const equipe = sessao.perfil.papel === "equipe";
  return (
    <div className="min-h-screen">
      <header className="nao-imprimir border-b border-borda bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-4 px-5 py-3">
          <Link href={equipe ? "/equipe" : "/minhas-viagens"} className="no-underline">
            <Marca />
          </Link>
          <div className="flex items-center gap-2">
            {equipe && (
              <Link href="/equipe" className="text-sm">
                Voltar ao painel
              </Link>
            )}
            <form action="/auth/sair" method="post">
              <button type="submit" className="flex h-11 cursor-pointer items-center gap-2 rounded-[12px] px-3 text-sm text-suave hover:bg-areia">
                <Icone nome="sair" tamanho={18} /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1040px] flex-col gap-7 px-5 pb-16 pt-8">{children}</main>
    </div>
  );
}
