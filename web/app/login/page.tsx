import { FormularioLogin } from "./FormularioLogin";
import { Marca } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="relative flex min-w-0 flex-[1_1_520px] flex-col justify-between gap-12 overflow-hidden bg-noite px-8 py-10 text-creme md:px-14 md:py-12">
        <Marca escuro />
        <svg aria-hidden="true" width="360" height="460" viewBox="0 0 360 460" fill="none" className="pointer-events-none absolute -right-10 top-28 hidden opacity-50 md:block">
          <rect x="20" y="20" width="320" height="420" rx="150" stroke="#C85A32" strokeWidth="2" />
          <rect x="44" y="44" width="272" height="372" rx="128" stroke="#5A463A" strokeWidth="1.5" />
          <path d="M60 250 C120 236 240 236 300 250" stroke="#C98A2C" strokeWidth="1.5" />
          <path d="M70 290 C140 276 220 276 290 290" stroke="#5A463A" strokeWidth="1.5" />
          <circle cx="232" cy="190" r="22" stroke="#F2A27E" strokeWidth="1.5" />
        </svg>
        <div className="relative flex max-w-[560px] flex-col gap-5">
          <span className="font-script text-[30px] text-terracota-claro">cada detalhe, cuidado por nós</span>
          <h1 className="font-serif text-4xl leading-[1.12] tracking-[-0.5px] md:text-[54px]">Sua viagem inteira, planejada com calma e precisão.</h1>
          <p className="max-w-[460px] text-[17px] leading-relaxed text-[#D9CCBD]">
            Passagens, hospedagem, passeios, roteiro e orientações, do primeiro planejamento ao retorno.
          </p>
        </div>
        <p className="relative text-[13px] text-[#B5A496]">Soares pelo Mundo · Assessoria de viagens</p>
      </section>

      <section className="flex min-w-0 flex-[1_1_440px] items-center justify-center px-6 py-12">
        <FormularioLogin erroInicial={erro} />
      </section>
    </div>
  );
}
