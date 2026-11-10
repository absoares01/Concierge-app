import { adicionarDaBusca } from "@/app/equipe/acoes";
import { BotaoEnviar } from "./BotaoEnviar";

export interface OpcaoViagem {
  id: string;
  rotulo: string;
}

// Formulário "Adicionar à viagem" usado nos resultados de busca.
export function AdicionarABusca({
  viagemId,
  viagens,
  campos,
  exemplo,
}: {
  viagemId: string | null;
  viagens: OpcaoViagem[];
  campos: Record<string, string | number | null | undefined>;
  exemplo: boolean;
}) {
  if (exemplo) {
    return <span className="text-xs text-erro">Dados de exemplo não podem ir para a viagem.</span>;
  }
  if (!viagemId && viagens.length === 0) {
    return <span className="text-xs text-suave">Crie uma viagem para adicionar.</span>;
  }
  return (
    <form action={adicionarDaBusca} className="flex flex-wrap items-center gap-2">
      {Object.entries(campos).map(([k, val]) =>
        val === null || val === undefined ? null : <input key={k} type="hidden" name={k} value={String(val)} />,
      )}
      {viagemId ? (
        <input type="hidden" name="viagem_id" value={viagemId} />
      ) : (
        <select name="viagem_id" required aria-label="Escolha a viagem" className="h-10 max-w-[220px] rounded-[10px] border border-campo bg-white px-2 text-[13px]">
          {viagens.map((v) => (
            <option key={v.id} value={v.id}>
              {v.rotulo}
            </option>
          ))}
        </select>
      )}
      <BotaoEnviar className="h-10 text-[13px]" enviando="Adicionando…">
        Adicionar à viagem
      </BotaoEnviar>
    </form>
  );
}
