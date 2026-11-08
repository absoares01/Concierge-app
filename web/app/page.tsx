import { redirect } from "next/navigation";
import { inicioDoPapel, lerSessao } from "@/lib/auth";

export default async function Inicio() {
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  redirect(inicioDoPapel(sessao.perfil.papel));
}
