"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icone, cx } from "./ui";

// Mensagens curtas mostradas depois de uma ação (ex.: ?ok=cliente-criado).
// Só aceita os códigos abaixo: nada vindo do endereço é exibido como texto livre.
const MENSAGENS: Record<string, { texto: string; tipo: "ok" | "aviso" }> = {
  "cliente-criado": { texto: "Cliente cadastrado com sucesso.", tipo: "ok" },
  "cliente-duplicado": { texto: "Este cliente já estava cadastrado. Abrimos o cadastro existente.", tipo: "aviso" },
  "cliente-salvo": { texto: "Dados do cliente salvos.", tipo: "ok" },
  "cliente-removido": { texto: "Cliente removido.", tipo: "ok" },
  "viagem-criada": { texto: "Viagem criada. Agora é só montar os itens.", tipo: "ok" },
  "viagem-salva": { texto: "Dados da viagem salvos.", tipo: "ok" },
  "item-adicionado": { texto: "Item adicionado à viagem.", tipo: "ok" },
  "acesso-liberado": { texto: "Acesso do cliente liberado.", tipo: "ok" },
};

export function Aviso() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const codigo = params.get("ok") ?? params.get("aviso");
  // A mensagem fica guardada no estado: o código sai do endereço logo depois.
  const [msg, setMsg] = useState<(typeof MENSAGENS)[string] | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const encontrada = codigo ? MENSAGENS[codigo] : undefined;
    if (!encontrada) return;
    setMsg(encontrada);
    setVisivel(true);
    // Tira o código do endereço (para não reaparecer ao recarregar) e some após 4 s.
    const resto = new URLSearchParams(params.toString());
    resto.delete("ok");
    resto.delete("aviso");
    const destino = resto.toString() ? `${path}?${resto.toString()}` : path;
    router.replace(destino + (typeof window !== "undefined" ? window.location.hash : ""), { scroll: false });
    const t = setTimeout(() => setVisivel(false), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  if (!msg) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "fixed bottom-6 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-[16px] px-5 py-3.5 text-[15px] font-medium shadow-[0_18px_40px_-16px_rgba(31,23,18,0.55)] transition-all duration-300",
        msg.tipo === "ok" ? "bg-noite text-creme" : "bg-aviso-fundo text-aviso",
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <span
        aria-hidden="true"
        className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", msg.tipo === "ok" ? "bg-salvia text-white" : "bg-ocre text-white")}
      >
        {msg.tipo === "ok" ? <Icone nome="check" tamanho={16} /> : "!"}
      </span>
      {msg.texto}
      <button type="button" onClick={() => setVisivel(false)} aria-label="Fechar aviso" className="ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
}
