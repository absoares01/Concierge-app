import type { Viagem } from "@/lib/types";
import { AreaTexto, Campo, Selecao } from "./ui";

export function CamposViagem({ v }: { v?: Partial<Viagem> }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      <Campo rotulo="Título" id="titulo" required defaultValue={v?.titulo ?? ""} placeholder="Ex.: Lisboa e Porto" className="col-span-full" />
      <Campo rotulo="Destino" id="destino" defaultValue={v?.destino ?? ""} placeholder="Cidades ou país" />
      <Campo rotulo="Ida" id="data_ida" type="date" defaultValue={v?.data_ida ?? ""} />
      <Campo rotulo="Volta" id="data_volta" type="date" defaultValue={v?.data_volta ?? ""} />
      <Campo rotulo="Viajantes" id="viajantes" defaultValue={v?.viajantes ?? ""} placeholder="Ex.: 2 adultos" />
      <Selecao rotulo="Pacote" id="pacote" defaultValue={v?.pacote ?? ""}>
        <option value="">A definir</option>
        <option value="essencial">Essencial</option>
        <option value="completo">Completo</option>
        <option value="premium">Premium</option>
      </Selecao>
      <Campo rotulo="Teto de orçamento (R$)" id="orcamento_teto" inputMode="decimal" defaultValue={v?.orcamento_teto ?? ""} />
      <AreaTexto
        rotulo="Recado para o cliente (aparece na página dele)"
        id="mensagem"
        defaultValue={v?.mensagem ?? ""}
        className="col-span-full"
        placeholder="Ex.: Montamos duas opções de voo; recomendamos a da TAP pelo horário de chegada."
      />
    </div>
  );
}
