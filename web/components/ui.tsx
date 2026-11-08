import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

export function Marca({ escuro = false, className = "" }: { escuro?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-baseline gap-1.5", className)}>
      <span className={cx("font-serif text-[21px] font-semibold tracking-[-0.5px]", escuro ? "text-creme" : "text-tinta")}>Soares</span>
      <span className={cx("font-script text-2xl", escuro ? "text-terracota-claro" : "text-terracota")}>concierge</span>
    </span>
  );
}

export function Titulo({ sobretitulo, children, acoes }: { sobretitulo?: string; children: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {sobretitulo && <span className="font-script text-[28px] leading-none text-terracota">{sobretitulo}</span>}
        <h1 className="font-serif text-4xl font-normal tracking-[-0.5px] md:text-[42px]">{children}</h1>
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </header>
  );
}

export function Cartao({ className = "", children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cx("rounded-[20px] border border-borda bg-white p-5 md:p-6", className)} {...rest}>
      {children}
    </section>
  );
}

export function Subtitulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={cx("font-serif text-[22px] font-normal", className)}>{children}</h2>;
}

export function Rotulo({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-[1.4px] text-suave">
      {children}
    </label>
  );
}

const campoBase = "h-[46px] w-full min-w-0 rounded-[12px] border border-campo bg-white px-3 text-[15px] text-tinta placeholder:text-suave/70";

export function Campo({ rotulo, id, className = "", ...rest }: ComponentProps<"input"> & { rotulo: string; id: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Rotulo htmlFor={id}>{rotulo}</Rotulo>
      <input id={id} name={rest.name ?? id} className={campoBase} {...rest} />
    </div>
  );
}

export function Selecao({ rotulo, id, children, className = "", ...rest }: ComponentProps<"select"> & { rotulo: string; id: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Rotulo htmlFor={id}>{rotulo}</Rotulo>
      <select id={id} name={rest.name ?? id} className={campoBase} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function AreaTexto({ rotulo, id, className = "", ...rest }: ComponentProps<"textarea"> & { rotulo: string; id: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <Rotulo htmlFor={id}>{rotulo}</Rotulo>
      <textarea id={id} name={rest.name ?? id} className="min-h-[88px] w-full rounded-[12px] border border-campo bg-white px-3 py-2.5 text-[15px] text-tinta" {...rest} />
    </div>
  );
}

const botaoVariantes = {
  primario: "bg-terracota text-white hover:bg-terracota-escuro hover:text-white border border-transparent",
  secundario: "bg-white text-tinta border border-campo hover:bg-areia hover:text-tinta",
  escuro: "bg-noite text-creme border border-noite hover:bg-tinta hover:text-creme",
  perigo: "bg-white text-erro border border-campo hover:bg-red-50 hover:text-erro",
};

type Variante = keyof typeof botaoVariantes;

export function Botao({ variante = "primario", className = "", ...rest }: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={cx(
        "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] px-4 text-sm font-medium no-underline disabled:cursor-not-allowed disabled:opacity-60",
        botaoVariantes[variante],
        className,
      )}
      {...rest}
    />
  );
}

export function BotaoLink({ variante = "primario", className = "", ...rest }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return (
    <Link
      className={cx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] px-4 text-sm font-medium no-underline",
        botaoVariantes[variante],
        className,
      )}
      {...rest}
    />
  );
}

const etiquetaCores = {
  neutra: "bg-areia text-suave",
  terracota: "bg-realce text-terracota-escuro",
  forte: "bg-terracota text-white",
  verde: "bg-salvia-fundo text-salvia-escuro",
  aviso: "bg-aviso-fundo text-aviso",
  escura: "bg-noite text-creme",
};

export function Etiqueta({ cor = "neutra", children, className = "" }: { cor?: keyof typeof etiquetaCores; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", etiquetaCores[cor], className)}>{children}</span>;
}

export function AvisoExemplo() {
  return (
    <p role="alert" className="rounded-[14px] border border-erro/30 bg-red-50 px-4 py-3 text-sm text-erro">
      <strong className="font-semibold">DADOS DE EXEMPLO.</strong> Não há chave da SerpApi configurada, então estes resultados são fictícios e não podem ser enviados a clientes.
    </p>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-[16px] border border-dashed border-campo bg-white/60 px-5 py-8 text-center text-[15px] text-suave">{children}</p>;
}

// Ícones de traço simples (aria-hidden)
const caminhos: Record<string, ReactNode> = {
  inicio: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  voo: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  cama: (
    <>
      <path d="M3 18V6" />
      <path d="M3 14h18v4" />
      <path d="M21 14v-3a3 3 0 0 0-3-3h-7v6" />
      <circle cx="7" cy="11" r="2" />
    </>
  ),
  mapa: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M17 4a4 4 0 0 1 0 8" />
      <path d="M22 21a7 7 0 0 0-4-6.3" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  sair: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  link: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  check: <path d="M5 12l4 4 10-10" />,
  mais: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
};

export function Icone({ nome, tamanho = 20, className = "" }: { nome: keyof typeof caminhos; tamanho?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {caminhos[nome]}
    </svg>
  );
}
