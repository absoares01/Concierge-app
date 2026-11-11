import "server-only";
import { createClient } from "./supabase/server";
import { periodo } from "./format";
import { adultosDe } from "./datas";
import type { OpcaoViagem } from "@/components/AdicionarABusca";

// Viagens em andamento, para o seletor "Adicionar à viagem" das buscas.
export async function viagensAbertas(): Promise<OpcaoViagem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("viagens")
    .select("id, titulo, data_ida, data_volta, clientes(nome)")
    .in("status", ["rascunho", "publicada"])
    .order("atualizado_em", { ascending: false })
    .limit(50);
  return ((data ?? []) as unknown as { id: string; titulo: string; data_ida: string | null; data_volta: string | null; clientes: { nome: string } | null }[]).map(
    (v) => ({ id: v.id, rotulo: `${v.clientes?.nome ?? "—"} · ${v.titulo} (${periodo(v.data_ida, v.data_volta)})` }),
  );
}

export interface DadosViagem {
  id: string;
  rotulo: string; // "Cliente · Título"
  destino: string | null;
  dataIda: string | null;
  dataVolta: string | null;
  adultos: number | null;
}


// Dados da viagem usados para pré-preencher as buscas (datas, destino, adultos).
export async function dadosDaViagem(id: string | null): Promise<DadosViagem | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("viagens").select("id, titulo, destino, data_ida, data_volta, viajantes, clientes(nome)").eq("id", id).maybeSingle();
  if (!data) return null;
  const d = data as unknown as {
    id: string;
    titulo: string;
    destino: string | null;
    data_ida: string | null;
    data_volta: string | null;
    viajantes: string | null;
    clientes: { nome: string } | null;
  };
  return {
    id: d.id,
    rotulo: `${d.clientes?.nome ?? "—"} · ${d.titulo}`,
    destino: d.destino,
    dataIda: d.data_ida,
    dataVolta: d.data_volta,
    adultos: adultosDe(d.viajantes),
  };
}
