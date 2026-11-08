import { exigirEquipe } from "@/lib/auth";
import { NavEquipe } from "./NavEquipe";

export default async function LayoutEquipe({ children }: { children: React.ReactNode }) {
  const sessao = await exigirEquipe();
  const nome = sessao.perfil.nome || sessao.email.split("@")[0];
  return (
    <div className="flex min-h-screen flex-wrap">
      <NavEquipe nome={nome} />
      <main className="min-w-0 flex-[999_1_560px] px-5 pb-16 pt-8 md:px-12 md:pt-10">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-7">{children}</div>
      </main>
    </div>
  );
}
