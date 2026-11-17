import { buscarHospedagem } from "@/lib/serpapi";
import { ranquearHospedagem } from "@/lib/ranking";
import { quando } from "@/lib/format";
import { lerBuscaHospedagem, type Params } from "@/lib/hospedagem";
import { uuidOuNulo } from "@/lib/validar";
import { dadosDaViagem, viagensAbertas } from "@/lib/viagens-abertas";
import type { ResultadoHospedagem } from "@/lib/types";
import { CamposDatas } from "@/components/CamposDatas";
import { ResultadosHospedagem } from "@/components/ResultadosHospedagem";
import { SeletorViagem } from "@/components/SeletorViagem";
import { AvisoExemplo, Botao, Campo, Cartao, Titulo, Vazio } from "@/components/ui";

export default async function BuscarHospedagem({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const [viagem, viagens] = await Promise.all([dadosDaViagem(uuidOuNulo(p.viagem)), viagensAbertas()]);
  const viagemId = viagem?.id ?? null;
  const busca = lerBuscaHospedagem(p);

  let resultado: ResultadoHospedagem | null = null;
  let erro: string | null = null;
  if (busca) {
    try {
      resultado = await buscarHospedagem(busca);
    } catch (e) {
      erro = (e as Error).message;
    }
  }

  const ranqueados = resultado ? ranquearHospedagem(resultado.opcoes) : [];

  return (
    <>
      <Titulo sobretitulo={viagem ? `para ${viagem.rotulo}` : "hotéis e aluguel por temporada"}>Buscar hospedagem</Titulo>

      <SeletorViagem caminho="/equipe/buscar/hospedagem" viagem={viagem} viagens={viagens} />

      <Cartao>
        <form method="get" className="flex flex-col gap-4">
          {viagemId && <input type="hidden" name="viagem" value={viagemId} />}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-end gap-3">
            <Campo rotulo="Destino" id="destino" required defaultValue={p.destino || viagem?.destino || ""} placeholder="Ex.: Chiado, Lisboa" className="md:col-span-2" />
            <CamposDatas
              nomeInicio="entrada"
              nomeFim="saida"
              rotuloInicio="Check-in"
              rotuloFim="Check-out"
              inicioPadrao={p.entrada || viagem?.dataIda || ""}
              fimPadrao={p.saida || viagem?.dataVolta || ""}
              obrigatorioInicio
              obrigatorioFim
            />
            <Campo rotulo="Hóspedes" id="adultos" type="number" min={1} max={12} defaultValue={p.adultos ?? String(viagem?.adultos ?? 2)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="temporada" defaultChecked={p.temporada === "on"} className="h-[18px] w-[18px] accent-terracota" />
              Aluguel por temporada (casas e apartamentos)
            </label>
            <Botao type="submit">Buscar</Botao>
          </div>
          <p className="text-xs text-suave">
            Fonte: Google Hotels via SerpApi, com preços de vários sites. O Airbnb não tem API pública: para um anúncio específico, adicione como item manual com o link.
          </p>
        </form>
      </Cartao>

      {erro && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-erro">
          Não foi possível buscar agora. {erro}
        </p>
      )}

      {resultado && busca && (
        <section className="flex flex-col gap-4" aria-label="Resultados">
          {resultado.exemplo && <AvisoExemplo />}
          <p className="text-sm text-suave">
            {ranqueados.length} opções · {resultado.noites} {resultado.noites === 1 ? "noite" : "noites"} · consultado {quando(resultado.consultadoEm)} · o destaque é sempre pelo critério escolhido, nunca por
            parceria.
          </p>

          {ranqueados.length === 0 ? (
            <Vazio>Nenhuma hospedagem com preço para essas datas.</Vazio>
          ) : (
            <ResultadosHospedagem
              ranqueados={ranqueados}
              noites={resultado.noites}
              exemplo={resultado.exemplo}
              consultadoEm={resultado.consultadoEm}
              busca={busca}
              viagemId={viagemId}
              viagens={viagens}
              ordemInicial={p.ordem}
            />
          )}
        </section>
      )}
    </>
  );
}
