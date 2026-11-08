"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Botao, Campo, cx } from "@/components/ui";

type Modo = "link" | "senha";

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("link");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(erroInicial ? "O link expirou ou já foi usado. Peça um novo abaixo." : null);
  const [enviado, setEnviado] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    try {
      if (modo === "senha") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        // shouldCreateUser: false → só entra quem a equipe já cadastrou.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setEnviado(true);
      }
    } catch {
      setErro(
        modo === "senha"
          ? "E-mail ou senha incorretos."
          : "Não encontramos um acesso para este e-mail. Fale com a sua consultora da Soares pelo Mundo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="flex w-full max-w-[440px] flex-col gap-5 rounded-[24px] border border-borda bg-white px-7 py-10 shadow-[0_24px_60px_-32px_rgba(43,33,24,0.35)] md:px-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-[34px] tracking-[-0.4px]">Bem-vindo de volta</h2>
        <p className="text-[15px] text-suave">Entre para ver sua viagem ou acessar o painel da equipe.</p>
      </div>

      <div role="group" aria-label="Forma de entrar" className="grid grid-cols-2 gap-1 rounded-[14px] bg-areia p-1">
        {(
          [
            ["link", "Link por e-mail"],
            ["senha", "E-mail e senha"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={modo === valor}
            onClick={() => {
              setModo(valor);
              setEnviado(false);
              setErro(null);
            }}
            className={cx("h-10 cursor-pointer rounded-[10px] text-sm", modo === valor ? "bg-white font-semibold text-tinta shadow-sm" : "text-suave")}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {enviado ? (
        <p role="status" className="rounded-[14px] bg-salvia-fundo px-4 py-3 text-[15px] leading-relaxed text-salvia-escuro">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra o e-mail neste aparelho e toque no link para entrar.
        </p>
      ) : (
        <>
          <Campo rotulo="E-mail" id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          {modo === "senha" && (
            <Campo rotulo="Senha" id="senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          )}
          {erro && (
            <p role="alert" className="text-sm text-erro">
              {erro}
            </p>
          )}
          <Botao type="submit" disabled={enviando} className="h-12 text-[15px]">
            {enviando ? "Aguarde…" : modo === "senha" ? "Entrar" : "Receber link de acesso"}
          </Botao>
        </>
      )}
      <p className="text-[13px] leading-relaxed text-suave">
        Clientes recebem o acesso pela consultora. A equipe pode entrar com senha ou com link.
      </p>
    </form>
  );
}
