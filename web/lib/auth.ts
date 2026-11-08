import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Papel, Perfil } from "./types";

export interface Sessao {
  userId: string;
  email: string;
  perfil: Perfil;
}

// Lê o usuário logado e o papel dele. Sempre confirma o usuário com o Supabase
// (getUser), nunca só pelo cookie.
export async function lerSessao(): Promise<Sessao | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("perfis").select("user_id, nome, papel").eq("user_id", user.id).maybeSingle();
  const perfil: Perfil = data ?? { user_id: user.id, nome: null, papel: "cliente" };
  return { userId: user.id, email: user.email ?? "", perfil };
}

export async function exigirLogin(): Promise<Sessao> {
  const s = await lerSessao();
  if (!s) redirect("/login");
  return s;
}

export async function exigirEquipe(): Promise<Sessao> {
  const s = await exigirLogin();
  if (s.perfil.papel !== "equipe") redirect("/minhas-viagens");
  return s;
}

export function inicioDoPapel(papel: Papel): string {
  return papel === "equipe" ? "/equipe" : "/minhas-viagens";
}
