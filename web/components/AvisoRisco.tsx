import type { Risco } from "@/lib/agencias";
import { cx } from "./ui";

// Aviso para passagens vendidas por agências que emitem com milhas de terceiros.
// A equipe vê o texto completo; o cliente vê a versão curta.
export function AvisoRisco({ risco, para, className }: { risco: Risco; para: "equipe" | "cliente"; className?: string }) {
  return (
    <p role="note" className={cx("flex gap-2 rounded-[12px] bg-aviso-fundo px-3 py-2 text-[13px] leading-snug text-aviso", className)}>
      <span aria-hidden="true" className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ocre text-xs font-bold text-white">
        !
      </span>
      <span>
        <strong className="font-semibold">{para === "equipe" ? `${risco.agencia}: atenção.` : "Atenção:"}</strong> {para === "equipe" ? risco.detalhe : risco.curto}
      </span>
    </p>
  );
}
