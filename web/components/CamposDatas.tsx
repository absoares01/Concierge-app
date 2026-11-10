"use client";

import { useState } from "react";
import { Rotulo, cx } from "./ui";
import { somarDias } from "@/lib/datas";

// Par de datas (ida/volta, check-in/check-out). Ao escolher a primeira, a segunda
// vira o dia seguinte se estiver vazia ou antes dela, e o calendário da segunda
// já abre no mês certo (atributo min).


const estiloCampo = "h-[46px] w-full min-w-0 rounded-[12px] border border-campo bg-white px-3 text-[15px] text-tinta";

export function CamposDatas({
  nomeInicio,
  nomeFim,
  rotuloInicio,
  rotuloFim,
  inicioPadrao = "",
  fimPadrao = "",
  obrigatorioInicio = false,
  obrigatorioFim = false,
  minimoDias = 1,
  className = "",
}: {
  nomeInicio: string;
  nomeFim: string;
  rotuloInicio: string;
  rotuloFim: string;
  inicioPadrao?: string;
  fimPadrao?: string;
  obrigatorioInicio?: boolean;
  obrigatorioFim?: boolean;
  minimoDias?: number; // 1 para hospedagem (sai no dia seguinte); 0 permite volta no mesmo dia
  className?: string;
}) {
  const [inicio, setInicio] = useState(inicioPadrao);
  const [fim, setFim] = useState(fimPadrao);

  function mudarInicio(valor: string) {
    setInicio(valor);
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor) && (!fim || fim < somarDias(valor, minimoDias))) setFim(somarDias(valor, 1));
  }

  return (
    <>
      <div className={cx("flex flex-col gap-1.5", className)}>
        <Rotulo htmlFor={nomeInicio}>{rotuloInicio}</Rotulo>
        <input id={nomeInicio} name={nomeInicio} type="date" required={obrigatorioInicio} value={inicio} onChange={(e) => mudarInicio(e.target.value)} className={estiloCampo} />
      </div>
      <div className={cx("flex flex-col gap-1.5", className)}>
        <Rotulo htmlFor={nomeFim}>{rotuloFim}</Rotulo>
        <input
          id={nomeFim}
          name={nomeFim}
          type="date"
          required={obrigatorioFim}
          min={inicio ? somarDias(inicio, minimoDias) : undefined}
          value={fim}
          onChange={(e) => setFim(e.target.value)}
          className={estiloCampo}
        />
      </div>
    </>
  );
}
