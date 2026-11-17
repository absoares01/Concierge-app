import type { LinkOferta } from "@/lib/types";
import { Icone, cx } from "./ui";

// O Google Flights abre o site do vendedor por um envio (POST) com uma ficha.
// Repetimos o mesmo envio numa aba nova; nada passa pelo nosso servidor.
export function IrParaSite({ link, principal = true }: { link: LinkOferta; principal?: boolean }) {
  return (
    <form action={link.url} method="post" target="_blank" rel="noopener noreferrer">
      {link.campos.map(([k, v], i) => (
        <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={cx(
          "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[12px] px-4 text-[13px] font-medium",
          principal ? "bg-terracota text-white hover:bg-terracota-escuro" : "border border-campo bg-white text-tinta hover:bg-areia",
        )}
      >
        {link.rotulo} <Icone nome="link" tamanho={15} />
      </button>
    </form>
  );
}
