"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, Marca, cx } from "@/components/ui";

const links = [
  { href: "/equipe", rotulo: "Painel", icone: "inicio" as const, exato: true },
  { href: "/equipe/clientes", rotulo: "Clientes", icone: "pessoas" as const },
  { href: "/equipe/buscar/voos", rotulo: "Buscar voos", icone: "voo" as const },
  { href: "/equipe/buscar/hospedagem", rotulo: "Buscar hospedagem", icone: "cama" as const },
];

export function NavEquipe({ nome }: { nome: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="nao-imprimir flex flex-[1_1_232px] flex-col gap-7 border-b border-borda bg-areia px-4 py-6 md:border-b-0 md:border-r md:py-7">
      <Link href="/equipe" className="px-2.5 no-underline">
        <Marca />
      </Link>
      <div className="flex flex-col gap-1">
        {links.map((l) => {
          const ativo = l.exato ? path === l.href : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo ? "page" : undefined}
              className={cx(
                "flex h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] text-tinta no-underline hover:bg-white/70 hover:text-tinta",
                ativo && "bg-white font-semibold shadow-[0_1px_0_#E8DEC8]",
              )}
            >
              <Icone nome={l.icone} className={ativo ? "text-terracota" : ""} />
              {l.rotulo}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex items-center gap-3 rounded-[16px] border border-borda bg-white p-3">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-realce text-sm font-semibold uppercase text-terracota">
          {nome.slice(0, 2)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col text-sm">
          <strong className="truncate font-semibold">{nome}</strong>
          <span className="text-[13px] text-suave">Equipe</span>
        </span>
        <form action="/auth/sair" method="post">
          <button type="submit" aria-label="Sair" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] text-suave hover:bg-areia">
            <Icone nome="sair" />
          </button>
        </form>
      </div>
    </nav>
  );
}
