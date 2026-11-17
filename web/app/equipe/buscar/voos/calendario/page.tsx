import Link from "next/link";
import { buscarCalendario } from "@/lib/serpapi";
import { DIAS_SEMANA, faixaDe, faixasDePreco, gradeDoMes, mesesDoPeriodo, nomeDiaSemana, nomeMes, periodoDe, precoCelula, proximosMeses, resumoDoCalendario } from "@/lib/calendario";
import { paramsDaBusca, type Params } from "@/lib/busca-voos";
import { brl, dataComDia, diasEntre, quando } from "@/lib/format";
import { iata, uuidOuNulo } from "@/lib/validar";
import { dadosDaViagem, viagensAbertas } from "@/lib/viagens-abertas";
import type { BuscaCalendario, PrecoDia, ResultadoCalendario } from "@/lib/types";
import { SeletorViagem } from "@/components/SeletorViagem";
import { AvisoExemplo, Botao, BotaoLink, Campo, Cartao, Icone, Selecao, Subtitulo, Titulo, Vazio, cx } from "@/components/ui";

// Calendário com o menor preço de cada dia (Google Flights via SerpApi, google_flights_calendar).
// Uma busca cobre até 3 meses e usa 1 crédito.

const COR: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-[color-mix(in_oklab,var(--color-salvia)_42%,white)] text-noite",
  2: "bg-[color-mix(in_oklab,var(--color-salvia)_16%,white)] text-tinta",
  3: "bg-areia text-tinta",
  4: "bg-[color-mix(in_oklab,var(--color-terracota)_20%,white)] text-tinta",
  5: "bg-[color-mix(in_oklab,var(--color-terracota)_45%,white)] text-noite",
};
const NOME_FAIXA = { 1: "faixa mais barata", 2: "barata", 3: "média", 4: "cara", 5: "faixa mais cara" } as const;

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function primeiroCodigo(v: string | undefined): string | null {
  return iata(v ?? null)?.split(",")[0] ?? null;
}

export default async function CalendarioVoos({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const hoje = hojeEmSaoPaulo();
  const [viagem, viagens] = await Promise.all([dadosDaViagem(uuidOuNulo(p.viagem)), viagensAbertas()]);
  const viagemId = viagem?.id ?? null;
  const meses = proximosMeses(hoje);

  // Padrões vindos da viagem: mês da ida e duração da estadia.
  const mesViagem = viagem?.dataIda && viagem.dataIda.slice(0, 7) >= meses[0].valor ? viagem.dataIda.slice(0, 7) : null;
  const diasViagem = viagem?.dataIda && viagem?.dataVolta ? diasEntre(viagem.dataIda, viagem.dataVolta) : null;
  const mes = meses.find((m) => m.valor === p.mes)?.valor ?? mesViagem ?? meses[0].valor;
  const quantosMeses = Math.min(3, Math.max(1, Number(p.meses) || 1));
  const soIda = p.soida === "on";
  const dias = Math.min(30, Math.max(1, Number(p.dias) || diasViagem || 7));
  const adultos = Math.min(9, Math.max(1, Number(p.adultos) || viagem?.adultos || 1));
  const classe = ([1, 2, 3, 4] as const).find((c) => String(c) === p.classe) ?? 1;

  const origem = primeiroCodigo(p.origem);
  const destino = primeiroCodigo(p.destino);
  const periodo = periodoDe(mes, quantosMeses, hoje);
  const busca: BuscaCalendario | null =
    origem && destino && periodo ? { origem, destino, inicio: periodo.inicio, fim: periodo.fim, diasViagem: soIda ? null : dias, adultos, classe, soDiretos: p.diretos === "on" } : null;

  let resultado: ResultadoCalendario | null = null;
  let erro: string | null = null;
  if (busca) {
    try {
      resultado = await buscarCalendario(busca);
    } catch (e) {
      erro = (e as Error).message;
    }
  }

  const porDia = new Map<string, PrecoDia>((resultado?.dias ?? []).map((d) => [d.ida, d]));
  const limites = faixasDePreco((resultado?.dias ?? []).map((d) => d.preco));
  const resumo = resultado ? resumoDoCalendario(resultado.dias) : null;
  const linkDia = (d: PrecoDia) =>
    `/equipe/buscar/voos?${paramsDaBusca(
      { origem: busca!.origem, destino: busca!.destino, ida: d.ida, volta: d.volta ?? undefined, adultos, classe, soDiretos: busca!.soDiretos },
      { viagem: viagemId ?? undefined },
    )}`;

  const maisBaratoSemana = resumo?.porDiaSemana[0];
  const maisCaroSemana = resumo?.porDiaSemana[resumo.porDiaSemana.length - 1];
  const maiorMediaMes = resumo ? Math.max(...resumo.porMes.map((m) => m.media)) : 0;

  return (
    <>
      <Titulo
        sobretitulo={viagem ? `para ${viagem.rotulo}` : "quando voar mais barato"}
        acoes={
          <BotaoLink href={`/equipe/buscar/voos${viagemId ? `?viagem=${viagemId}` : ""}`} variante="secundario">
            Busca por data
          </BotaoLink>
        }
      >
        Calendário de preços
      </Titulo>

      <SeletorViagem caminho="/equipe/buscar/voos/calendario" viagem={viagem} viagens={viagens} />

      <Cartao>
        <form method="get" className="flex flex-col gap-4">
          {viagemId && <input type="hidden" name="viagem" value={viagemId} />}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] items-end gap-3">
            <Campo rotulo="Origem (IATA)" id="origem" required defaultValue={p.origem ?? ""} placeholder="GRU" />
            <Campo rotulo="Destino (IATA)" id="destino" required defaultValue={p.destino ?? ""} placeholder="LIS" />
            <Selecao rotulo="A partir de" id="mes" defaultValue={mes}>
              {meses.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Período" id="meses" defaultValue={String(quantosMeses)}>
              <option value="1">1 mês</option>
              <option value="2">2 meses</option>
              <option value="3">3 meses</option>
            </Selecao>
            <Campo rotulo="Dias de viagem" id="dias" type="number" min={1} max={30} defaultValue={String(dias)} />
            <Campo rotulo="Adultos" id="adultos" type="number" min={1} max={9} defaultValue={String(adultos)} />
            <Selecao rotulo="Classe" id="classe" defaultValue={String(classe)}>
              <option value="1">Econômica</option>
              <option value="2">Premium</option>
              <option value="3">Executiva</option>
              <option value="4">Primeira</option>
            </Selecao>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="soida" defaultChecked={soIda} className="h-[18px] w-[18px] accent-terracota" />
                Só ida
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="diretos" defaultChecked={p.diretos === "on"} className="h-[18px] w-[18px] accent-terracota" />
                Só voos diretos
              </label>
            </div>
            <Botao type="submit">Ver calendário</Botao>
          </div>
          <p className="text-xs text-suave">
            Cada dia mostra o menor preço para sair naquela data{soIda ? "" : ` e voltar ${dias} ${dias === 1 ? "dia" : "dias"} depois`}, total para todos os adultos. Uma busca usa 1 crédito da SerpApi,
            seja de 1 ou de 3 meses. Use um aeroporto de cada lado.
          </p>
        </form>
      </Cartao>

      {erro && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-erro">
          Não foi possível buscar agora. {erro}
        </p>
      )}

      {resultado && busca && (
        <section className="flex flex-col gap-5" aria-label="Calendário">
          {resultado.exemplo && <AvisoExemplo />}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-suave">
            <span>
              {busca.origem} → {busca.destino} · {resultado.dias.length} dias com preço · consultado {quando(resultado.consultadoEm)}
            </span>
            {resultado.linkGoogle && (
              <a href={resultado.linkGoogle} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                Abrir no Google Flights <Icone nome="link" tamanho={14} />
              </a>
            )}
          </div>

          {!resumo && <Vazio>O Google não trouxe preços para esse trecho e período. Tente outro mês ou outro aeroporto.</Vazio>}

          {resumo && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
              <Cartao className="flex flex-col gap-1 !p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Dia mais barato</span>
                <strong className="font-serif text-[26px] font-medium text-salvia">{brl(resumo.menor.preco)}</strong>
                <Link href={linkDia(resumo.menor)} className="text-sm">
                  {dataComDia(resumo.menor.ida)}
                  {resumo.menor.volta ? ` a ${dataComDia(resumo.menor.volta)}` : ""} →
                </Link>
              </Cartao>
              <Cartao className="flex flex-col gap-1 !p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Dia mais caro</span>
                <strong className="font-serif text-[26px] font-medium text-terracota">{brl(resumo.maior.preco)}</strong>
                <span className="text-sm text-suave">
                  {dataComDia(resumo.maior.ida)} · {Math.round((resumo.maior.preco / resumo.menor.preco - 1) * 100)}% acima do mais barato
                </span>
              </Cartao>
              <Cartao className="flex flex-col gap-1 !p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Média do período</span>
                <strong className="font-serif text-[26px] font-medium">{brl(resumo.media)}</strong>
                <span className="text-sm text-suave">em {resumo.dias} dias</span>
              </Cartao>
              {maisBaratoSemana && maisCaroSemana && maisBaratoSemana.dia !== maisCaroSemana.dia && (
                <Cartao className="flex flex-col gap-1 !p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">Melhor dia para sair</span>
                  <strong className="font-serif text-[26px] font-medium">{maiuscula(nomeDiaSemana(maisBaratoSemana.dia))}</strong>
                  <span className="text-sm text-suave">
                    média {brl(maisBaratoSemana.media)}; evite {nomeDiaSemana(maisCaroSemana.dia)} ({brl(maisCaroSemana.media)})
                  </span>
                </Cartao>
              )}
            </div>
          )}

          {resumo && resumo.porMes.length > 1 && (
            <Cartao className="flex flex-col gap-3">
              <Subtitulo>Comparação entre meses</Subtitulo>
              <ul className="flex flex-col gap-2.5">
                {resumo.porMes.map((m) => (
                  <li key={m.mes} className="grid grid-cols-[90px_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[130px_1fr_auto]">
                    <span>{maiuscula(nomeMes(m.mes).replace(/ de \d+$/, ""))}</span>
                    <span className="h-3 rounded-full bg-areia" aria-hidden="true">
                      <span className="block h-3 rounded-full bg-terracota/70" style={{ width: `${Math.max(8, (m.media / maiorMediaMes) * 100)}%` }} />
                    </span>
                    <span className="col-start-2 text-[13px] sm:col-start-auto">
                      média <strong className="font-semibold">{brl(m.media)}</strong> · menor {brl(m.menor)}
                    </span>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          {resumo && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-suave" aria-label="Legenda">
              <span>Mais barato</span>
              {([1, 2, 3, 4, 5] as const).map((f, i) => (
                <span key={f} className={cx("inline-flex h-6 min-w-[64px] items-center justify-center rounded-[6px] px-1.5", COR[f])}>
                  {f < 5 ? `até ${precoCelula(limites[i])}` : `acima de ${precoCelula(limites[3])}`}
                </span>
              ))}
              <span>Mais caro</span>
            </div>
          )}

          {resumo && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-4">
              {mesesDoPeriodo(busca.inicio, busca.fim).map((m) => (
                <Cartao key={m} className="flex flex-col gap-3 !p-4">
                  <h2 className="font-serif text-xl">{maiuscula(nomeMes(m))}</h2>
                  <table className="w-full table-fixed border-separate border-spacing-1 text-center">
                    <thead>
                      <tr>
                        {DIAS_SEMANA.map((d) => (
                          <th key={d} scope="col" className="text-[11px] font-semibold uppercase text-suave">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradeDoMes(m).map((semana, k) => (
                        <tr key={k}>
                          {semana.map((dia, j) => {
                            if (!dia) return <td key={j} />;
                            const d = porDia.get(dia);
                            const num = Number(dia.slice(8));
                            if (!d)
                              return (
                                <td key={j} className="h-14 rounded-[8px] align-top text-[12px] text-suave/50">
                                  <span className="block pt-1.5">{num}</span>
                                </td>
                              );
                            const f = faixaDe(d.preco, limites);
                            const menor = d.ida === resumo.menor.ida;
                            return (
                              <td key={j} className="h-14 p-0">
                                <Link
                                  href={linkDia(d)}
                                  aria-label={`${dataComDia(d.ida)}: ${brl(d.preco)}, ${NOME_FAIXA[f]}${menor ? ", o menor preço do período" : ""}`}
                                  title={`${dataComDia(d.ida)}${d.volta ? ` a ${dataComDia(d.volta)}` : ""}: ${brl(d.preco)}`}
                                  className={cx(
                                    "flex h-full flex-col items-center justify-center gap-0.5 rounded-[8px] no-underline hover:ring-2 hover:ring-noite/60",
                                    COR[f],
                                    menor && "ring-2 ring-salvia-escuro",
                                  )}
                                >
                                  <span className="text-[11px] leading-none opacity-80">{num}</span>
                                  <span className="text-[12px] font-semibold leading-none">{precoCelula(d.preco)}</span>
                                </Link>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Cartao>
              ))}
            </div>
          )}

          {resumo && (
            <p className="text-xs text-suave">
              Toque num dia para abrir a busca completa daquela data, com horários, bagagem e a lista de sites. Os preços do calendário são o menor valor que o Google encontrou e podem mudar até a compra.
            </p>
          )}
        </section>
      )}
    </>
  );
}
