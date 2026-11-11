"use client";

import { useFormStatus } from "react-dom";
import { Botao } from "./ui";

// Botão de envio que se desativa enquanto o formulário está sendo salvo.
// Evita cliques repetidos (e cadastros duplicados) e mostra que algo está acontecendo.
export function BotaoEnviar({
  children,
  enviando = "Salvando…",
  variante,
  className,
}: {
  children: React.ReactNode;
  enviando?: string;
  variante?: "primario" | "secundario" | "escuro" | "perigo" | "perigoForte";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" variante={variante} className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {enviando}
        </>
      ) : (
        children
      )}
    </Botao>
  );
}
