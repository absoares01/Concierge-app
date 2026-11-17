// Agências que vendem passagens emitidas com milhas de terceiros.
// O item continua podendo ir para a viagem: a etiqueta só deixa o risco à vista,
// para a equipe e para o cliente. Fatos conferidos em 11/2026; revise se mudarem.

export interface Risco {
  agencia: string;
  // Texto curto mostrado ao cliente.
  curto: string;
  // Texto completo mostrado à equipe.
  detalhe: string;
}

const EMISSAO_MILHAS = "Vende passagens emitidas com milhas de terceiros: em caso de cancelamento ou mudança, o atendimento é pela agência, não pela companhia aérea.";

const AGENCIAS: { padrao: RegExp; dominio: RegExp; risco: Risco }[] = [
  {
    padrao: /\b123\s*milhas\b/i,
    dominio: /(^|\.)123milhas\.com(\.br)?$/i,
    risco: {
      agencia: "123milhas",
      curto: EMISSAO_MILHAS,
      detalhe: `${EMISSAO_MILHAS} A empresa está em recuperação judicial desde 2023.`,
    },
  },
  {
    padrao: /\bmax\s*milhas\b/i,
    dominio: /(^|\.)maxmilhas\.com(\.br)?$/i,
    risco: {
      agencia: "MaxMilhas",
      curto: EMISSAO_MILHAS,
      detalhe: `${EMISSAO_MILHAS} É do mesmo grupo da 123milhas, em recuperação judicial desde 2023.`,
    },
  },
  {
    padrao: /\bhot\s*milhas\b/i,
    dominio: /(^|\.)hotmilhas\.com(\.br)?$/i,
    risco: {
      agencia: "HotMilhas",
      curto: EMISSAO_MILHAS,
      detalhe: `${EMISSAO_MILHAS} É do mesmo grupo da 123milhas, em recuperação judicial desde 2023.`,
    },
  },
];

function dominioDe(texto: string): string | null {
  try {
    return new URL(texto).hostname;
  } catch {
    return null;
  }
}

// Procura uma agência de risco no nome do vendedor, na fonte, no título ou no domínio do link.
export function riscoDe(...textos: (string | null | undefined)[]): Risco | null {
  for (const t of textos) {
    if (!t) continue;
    const dominio = dominioDe(t);
    for (const a of AGENCIAS) {
      if (dominio ? a.dominio.test(dominio) : a.padrao.test(t)) return a.risco;
    }
  }
  return null;
}
