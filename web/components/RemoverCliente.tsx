import { excluirCliente } from "@/app/equipe/acoes";
import { BotaoEnviar } from "./BotaoEnviar";
import { cx } from "./ui";

// Remoção em duas etapas, sem janela de confirmação do navegador:
// "Remover" abre a confirmação; só "Sim, remover" apaga.
export function RemoverCliente({ clienteId, nome, viagens, compacto = false }: { clienteId: string; nome: string; viagens: number; compacto?: boolean }) {
  return (
    <details className={cx("group relative", compacto ? "" : "w-full")}>
      <summary
        className={cx(
          "flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-[12px] border border-campo bg-white text-sm font-medium text-erro hover:bg-red-50 [&::-webkit-details-marker]:hidden",
          compacto ? "h-11 px-3" : "h-11 w-full px-4",
        )}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
        Remover
      </summary>
      <form
        action={excluirCliente}
        className={cx(
          "z-10 mt-2 flex flex-col gap-3 rounded-[14px] border border-erro/30 bg-white p-4 text-sm shadow-[0_18px_40px_-20px_rgba(31,23,18,0.45)]",
          compacto ? "absolute right-0 w-[280px]" : "",
        )}
      >
        <input type="hidden" name="cliente_id" value={clienteId} />
        <input type="hidden" name="confirmar" value="sim" />
        <p className="leading-relaxed text-tinta">
          Remover <strong>{nome}</strong>
          {viagens > 0 ? ` e ${viagens === 1 ? "a viagem dele" : `as ${viagens} viagens dele`}` : ""}? Não dá para desfazer.
        </p>
        <BotaoEnviar variante="perigoForte" enviando="Removendo…">
          Sim, remover
        </BotaoEnviar>
      </form>
    </details>
  );
}
