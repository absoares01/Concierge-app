import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminConfigurado, urlDoApp } from "@/lib/supabase/env";
import { ROTULO_STATUS, periodo } from "@/lib/format";
import type { Cliente, Viagem } from "@/lib/types";
import { atualizarCliente, criarViagem, liberarAcesso, revogarAcesso } from "../../acoes";
import { CamposViagem } from "@/components/CamposViagem";
import { AreaTexto, Botao, Campo, Cartao, Etiqueta, Subtitulo, Titulo, Vazio } from "@/components/ui";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { RemoverCliente } from "@/components/RemoverCliente";

const corStatus = { rascunho: "aviso", publicada: "verde", concluida: "neutra" } as const;

export default async function ClienteDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle<Cliente>();
  if (!cliente) notFound();
  const { data: viagens } = await supabase.from("viagens").select("*").eq("cliente_id", id).order("data_ida", { ascending: false });

  const mensagemAcesso = encodeURIComponent(
    `Olá, ${cliente.nome.split(" ")[0]}! Sua viagem já está no app da Soares pelo Mundo. ` +
      `Entre em ${urlDoApp()}/login com o e-mail ${cliente.email ?? ""} e toque em "Receber link de acesso".`,
  );
  const whatsapp = cliente.telefone ? `https://wa.me/${cliente.telefone.replace(/\D/g, "")}?text=${mensagemAcesso}` : null;

  return (
    <>
      <Titulo sobretitulo="cliente" acoes={<RemoverCliente clienteId={cliente.id} nome={cliente.nome} viagens={(viagens ?? []).length} compacto />}>
        {cliente.nome}
      </Titulo>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
          <section className="flex flex-col gap-3" aria-label="Viagens">
            <Subtitulo>Viagens</Subtitulo>
            {(viagens ?? []).length === 0 ? (
              <Vazio>Nenhuma viagem para este cliente ainda. Crie a primeira abaixo.</Vazio>
            ) : (
              (viagens as Viagem[]).map((v) => (
                <Link
                  key={v.id}
                  href={`/equipe/viagens/${v.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] border border-borda bg-white px-5 py-4 text-tinta no-underline hover:border-terracota hover:text-tinta"
                >
                  <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                    <strong className="font-semibold">{v.titulo}</strong>
                    <span className="text-sm text-suave">
                      {v.destino ?? "destino a definir"} · {periodo(v.data_ida, v.data_volta)}
                    </span>
                  </span>
                  <Etiqueta cor={corStatus[v.status]}>{ROTULO_STATUS[v.status]}</Etiqueta>
                </Link>
              ))
            )}
          </section>

          <Cartao>
            <form action={criarViagem} className="flex flex-col gap-4">
              <input type="hidden" name="cliente_id" value={cliente.id} />
              <Subtitulo>Nova viagem</Subtitulo>
              <CamposViagem />
              <BotaoEnviar className="self-start" enviando="Criando…">
                Criar viagem
              </BotaoEnviar>
            </form>
          </Cartao>
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          <Cartao className="flex flex-col gap-3">
            <Subtitulo>Acesso do cliente</Subtitulo>
            {cliente.user_id ? (
              <>
                <Etiqueta cor="verde" className="self-start">
                  Acesso liberado
                </Etiqueta>
                <p className="text-sm leading-relaxed text-suave">
                  O cliente entra em <strong>{urlDoApp()}/login</strong> com <strong>{cliente.email}</strong>, toca em “Receber link de acesso” e vê só as
                  viagens <strong>publicadas</strong>.
                </p>
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm font-medium">
                    Enviar instruções pelo WhatsApp
                  </a>
                )}
                <form action={revogarAcesso}>
                  <input type="hidden" name="cliente_id" value={cliente.id} />
                  <BotaoEnviar variante="perigo" className="w-full" enviando="Removendo…">
                    Remover acesso
                  </BotaoEnviar>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-suave">
                  Libere o acesso para o cliente acompanhar a viagem no modo leitura: voos, hospedagem, roteiro, documentos e links de compra.
                </p>
                {!cliente.email && <p className="text-sm text-aviso">Cadastre o e-mail do cliente primeiro.</p>}
                {!adminConfigurado() && <p className="text-sm text-aviso">Falta a variável SUPABASE_SERVICE_ROLE_KEY no servidor.</p>}
                <form action={liberarAcesso}>
                  <input type="hidden" name="cliente_id" value={cliente.id} />
                  {cliente.email && adminConfigurado() ? (
                    <BotaoEnviar className="w-full" enviando="Liberando…">
                      Liberar acesso
                    </BotaoEnviar>
                  ) : (
                    <Botao type="button" className="w-full" disabled>
                      Liberar acesso
                    </Botao>
                  )}
                </form>
              </>
            )}
          </Cartao>

          <Cartao>
            <form action={atualizarCliente} className="flex flex-col gap-4">
              <input type="hidden" name="cliente_id" value={cliente.id} />
              <Subtitulo>Dados</Subtitulo>
              <Campo rotulo="Nome" id="nome" required defaultValue={cliente.nome} />
              <Campo rotulo="E-mail" id="email" type="email" defaultValue={cliente.email ?? ""} />
              <Campo rotulo="Telefone / WhatsApp" id="telefone" defaultValue={cliente.telefone ?? ""} />
              <AreaTexto rotulo="Notas internas (o cliente não vê)" id="notas_internas" defaultValue={cliente.notas_internas ?? ""} />
              <BotaoEnviar variante="secundario">Salvar dados</BotaoEnviar>
            </form>
          </Cartao>
        </div>
      </div>
    </>
  );
}
