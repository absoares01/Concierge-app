"use client";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="nao-imprimir inline-flex h-11 cursor-pointer items-center rounded-[12px] border border-noite-borda px-4 text-sm text-creme hover:bg-white/10"
    >
      Imprimir ou salvar PDF
    </button>
  );
}
