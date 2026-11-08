// ---------- Banco de dados ----------
export type Papel = "equipe" | "cliente";

export interface Perfil {
  user_id: string;
  nome: string | null;
  papel: Papel;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  notas_internas: string | null;
  user_id: string | null;
  criado_em: string;
}

export type StatusViagem = "rascunho" | "publicada" | "concluida";
export type Pacote = "essencial" | "completo" | "premium";

export interface Viagem {
  id: string;
  cliente_id: string;
  titulo: string;
  destino: string | null;
  data_ida: string | null;
  data_volta: string | null;
  viajantes: string | null;
  pacote: Pacote | null;
  status: StatusViagem;
  orcamento_teto: number | null;
  mensagem: string | null;
  criado_em: string;
  atualizado_em: string;
}

export type TipoItem = "voo" | "hospedagem" | "passeio" | "transporte" | "seguro" | "atividade" | "outro";
export type Situacao = "sugestao" | "recomendado" | "reservado";

export interface ItemViagem {
  id: string;
  viagem_id: string;
  tipo: TipoItem;
  titulo: string;
  descricao: string | null;
  data: string | null;
  hora: string | null;
  data_fim: string | null;
  local: string | null;
  preco: number | null;
  moeda: string;
  preco_ref: "total" | "pessoa" | "noite" | null;
  milhas: number | null;
  programa: string | null;
  taxas: number | null;
  link_compra: string | null;
  fonte: string | null;
  consultado_em: string | null;
  situacao: Situacao;
  visivel_cliente: boolean;
  ordem: number;
  criado_em: string;
}

export type EstadoChecklist = "ok" | "pendente" | "atencao";

export interface ItemChecklist {
  id: string;
  viagem_id: string;
  texto: string;
  estado: EstadoChecklist;
  fonte_url: string | null;
  ordem: number;
}

// ---------- Pesquisa de voos ----------
export interface Trecho {
  companhia: string;
  numero: string;
  de: string;
  deNome: string;
  para: string;
  paraNome: string;
  partida: string; // "YYYY-MM-DD HH:mm" horário local
  chegada: string;
  duracaoMin: number;
}

export type Bagagem = "incluida" | "nao_incluida" | "nao_informada";

export interface Voo {
  id: string;
  preco: number | null; // total da busca (todos os passageiros), na moeda pedida
  companhias: string[];
  logo?: string;
  duracaoMin: number;
  escalas: number;
  conexoes: { aeroporto: string; duracaoMin: number }[];
  trechos: Trecho[];
  origem: string;
  destino: string;
  partida: string;
  chegada: string;
  trocaAeroporto: boolean;
  conexaoLongaMin: number;
  bagagem: { status: Bagagem; texto: string };
}

export interface BuscaVoos {
  origem: string;
  destino: string;
  ida: string;
  volta?: string;
  adultos: number;
  classe: 1 | 2 | 3 | 4; // 1 econômica, 2 premium, 3 executiva, 4 primeira
  soDiretos?: boolean;
}

export interface ResultadoVoos {
  voos: Voo[];
  exemplo: boolean;
  consultadoEm: string;
  linkGoogle?: string;
  faixaTipica?: { min?: number; max?: number; nivel?: string };
}

// ---------- Pesquisa de hospedagem ----------
export interface Hospedagem {
  id: string;
  nome: string;
  tipo: string; // "hotel" ou "aluguel por temporada" etc.
  temporada: boolean;
  estrelas: number | null;
  nota: number | null; // 0 a 5 (Google)
  avaliacoes: number | null;
  porNoite: number | null;
  total: number | null;
  link: string | null;
  foto: string | null;
  lat: number | null;
  lon: number | null;
  ofertas: { site: string; porNoite: number | null; link: string | null }[];
  comodidades: string[];
}

export interface BuscaHospedagem {
  destino: string;
  entrada: string;
  saida: string;
  adultos: number;
  temporada: boolean; // true = aluguel por temporada (casas e apartamentos)
}

export interface ResultadoHospedagem {
  opcoes: Hospedagem[];
  exemplo: boolean;
  consultadoEm: string;
  noites: number;
}

// ---------- Ranking ----------
export interface Ranqueado<T> {
  item: T;
  nota: number; // 0 a 10
  motivos: string[];
}
