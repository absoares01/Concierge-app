import Link from "next/link";
import type { DadosViagem } from "@/lib/viagens-abertas";
import type { OpcaoViagem } from "./AdicionarABusca";
import { Botao } from "./ui";

// Topo das páginas de busca: mostra para qual viagem se está buscando, ou deixa
// escolher uma para preencher datas, hóspedes e destino automaticamente.
export function SeletorViagem({ caminho, viagem, viagens }: { caminho: string; viagem: DadosViagem | null; viagens: OpcaoViagem[] }) {
  if (viagem) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-realce px-4 py-3 text-sm">
        <span>
          Buscando para <strong className="font-semibold">{viagem.rotulo}</strong>. Datas{viagem.adultos ? ", viajantes" : ""} e destino preenchidos pela viagem.
        </span>
        <Link href={`/equipe/viagens/${viagem.id}`} className="font-medium">
          Abrir viagem
        </Link>
        <Link href={caminho} className="font-medium">
          Busca avulsa
        </Link>
      </div>
    );
  }
  if (viagens.length === 0) return null;
  return (
    <form method="get" action={caminho} className="flex flex-wrap items-center gap-2 rounded-[14px] bg-areia px-4 py-3 text-sm">
      <label htmlFor="viagem" className="text-suave">
        Buscar para uma viagem:
      </label>
      <select id="viagem" name="viagem" className="h-10 min-w-0 max-w-full flex-1 rounded-[10px] border border-campo bg-white px-2 text-[13px] sm:max-w-[360px]">
        {viagens.map((v) => (
          <option key={v.id} value={v.id}>
            {v.rotulo}
          </option>
        ))}
      </select>
      <Botao type="submit" variante="secundario" className="h-10 text-[13px]">
        Usar dados da viagem
      </Botao>
    </form>
  );
}
