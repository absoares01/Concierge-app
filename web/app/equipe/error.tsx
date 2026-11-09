"use client";

import { Botao, Cartao } from "@/components/ui";

export default function ErroEquipe({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Cartao className="flex flex-col gap-3">
      <h1 className="font-serif text-2xl">Algo não saiu como esperado</h1>
      <p className="text-sm text-suave">{error.message || "Tente novamente em instantes."}</p>
      <Botao onClick={reset} className="self-start">
        Tentar de novo
      </Botao>
    </Cartao>
  );
}
