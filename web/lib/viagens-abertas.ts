import "server-only";
import { createClient } from "./supabase/server";
import { periodo } from "./format";
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

export async function tituloDaViagem(id: string | null): Promise<string | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("viagens").select("titulo, clientes(nome)").eq("id", id).maybeSingle();
  if (!data) return null;
  const d = data as unknown as { titulo: string; clientes: { nome: string } | null };
  return `${d.clientes?.nome ?? "—"} · ${d.titulo}`;
}
