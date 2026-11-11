"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirEquipe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminConfigurado } from "@/lib/supabase/env";
import * as v from "@/lib/validar";

// Todas as ações começam confirmando que quem pede é da equipe. As regras do banco
// (RLS) conferem de novo: mesmo que esta checagem falhasse, um cliente não grava nada.

const TIPOS = ["voo", "hospedagem", "passeio", "transporte", "seguro", "atividade", "outro"] as const;
const SITUACOES = ["sugestao", "recomendado", "reservado"] as const;
const STATUS = ["rascunho", "publicada", "concluida"] as const;
const PACOTES = ["essencial", "completo", "premium"] as const;
const ESTADOS = ["ok", "pendente", "atencao"] as const;

function falhou(error: { message: string } | null) {
  if (error) throw new Error(`Não foi possível salvar: ${error.message}`);
}

// ---------------- Clientes ----------------

export async function criarCliente(fd: FormData) {
  await exigirEquipe();
  const supabase = await createClient();
  const nome = v.obrigatorio(fd, "nome", 120);
  const email = v.texto(fd, "email", 200)?.toLowerCase() ?? null;
  const telefone = v.texto(fd, "telefone", 40);

  // Evita cadastro duplicado: mesmo e-mail, ou mesmo nome com o mesmo telefone
  // (ou sem telefone, cadastrado nos últimos 10 minutos, típico de clique repetido).
  let existente: { id: string } | null = null;
  if (email) {
    const { data } = await supabase.from("clientes").select("id").eq("email", email).limit(1).maybeSingle();
    existente = data;
  }
  if (!existente) {
    let consulta = supabase.from("clientes").select("id").ilike("nome", nome.replace(/[%_]/g, "\\$&"));
    consulta = telefone
      ? consulta.eq("telefone", telefone)
      : consulta.is("telefone", null).gte("criado_em", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    const { data } = await consulta.limit(1).maybeSingle();
    existente = data;
  }
  if (existente) redirect(`/equipe/clientes/${existente.id}?aviso=cliente-duplicado`);

  const { data, error } = await supabase
    .from("clientes")
    .insert({ nome, email, telefone, notas_internas: v.texto(fd, "notas_internas", 4000) })
    .select("id")
    .single();
  falhou(error);
  redirect(`/equipe/clientes/${data!.id}?ok=cliente-criado`);
}

// Remove o cliente, as viagens dele (em cascata) e, se houver, o login de cliente.
export async function excluirCliente(fd: FormData) {
  await exigirEquipe();
  const clienteId = v.id(fd, "cliente_id");
  if (v.texto(fd, "confirmar", 10) !== "sim") throw new Error("Confirme a remoção.");
  const supabase = await createClient();
  const { data: cliente } = await supabase.from("clientes").select("user_id").eq("id", clienteId).maybeSingle();
  const { error } = await supabase.from("clientes").delete().eq("id", clienteId);
  falhou(error);

  if (cliente?.user_id && adminConfigurado()) {
    const admin = createAdminClient();
    const { data: perfil } = await admin.from("perfis").select("papel").eq("user_id", cliente.user_id).maybeSingle();
    // Nunca apaga login da equipe.
    if (perfil?.papel === "cliente") await admin.auth.admin.deleteUser(cliente.user_id);
  }
  revalidatePath("/equipe/clientes");
  redirect("/equipe/clientes?ok=cliente-removido");
}

export async function atualizarCliente(fd: FormData) {
  await exigirEquipe();
  const clienteId = v.id(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nome: v.obrigatorio(fd, "nome", 120),
      email: v.texto(fd, "email", 200)?.toLowerCase() ?? null,
      telefone: v.texto(fd, "telefone", 40),
      notas_internas: v.texto(fd, "notas_internas", 4000),
    })
    .eq("id", clienteId);
  falhou(error);
  revalidatePath(`/equipe/clientes/${clienteId}`);
  redirect(`/equipe/clientes/${clienteId}?ok=cliente-salvo`);
}

// Cria (ou reaproveita) o login do cliente e associa ao cadastro. O cliente entra
// depois pela página de login, com "Receber link de acesso".
export async function liberarAcesso(fd: FormData) {
  await exigirEquipe();
  if (!adminConfigurado()) throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY para liberar acessos.");
  const clienteId = v.id(fd, "cliente_id");
  const supabase = await createClient();
  const { data: cliente, error: e1 } = await supabase.from("clientes").select("id, nome, email").eq("id", clienteId).single();
  falhou(e1);
  const email = cliente!.email?.trim().toLowerCase();
  if (!email) throw new Error("Cadastre o e-mail do cliente antes de liberar o acesso.");

  const admin = createAdminClient();
  let userId: string | null = null;
  const criado = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { nome: cliente!.nome } });
  if (criado.data.user) {
    userId = criado.data.user.id;
  } else {
    // Já existe um login com este e-mail: procura e reaproveita.
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (data.users.length < 200) break;
    }
  }
  if (!userId) throw new Error(`Não foi possível criar o login: ${criado.error?.message ?? "erro desconhecido"}`);

  const { data: perfil } = await admin.from("perfis").select("papel").eq("user_id", userId).maybeSingle();
  if (perfil?.papel === "equipe") throw new Error("Este e-mail pertence a alguém da equipe. Use outro e-mail para o cliente.");

  const { error } = await supabase.from("clientes").update({ user_id: userId }).eq("id", clienteId);
  falhou(error);
  revalidatePath(`/equipe/clientes/${clienteId}`);
  redirect(`/equipe/clientes/${clienteId}?ok=acesso-liberado`);
}

export async function revogarAcesso(fd: FormData) {
  await exigirEquipe();
  const clienteId = v.id(fd, "cliente_id");
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ user_id: null }).eq("id", clienteId);
  falhou(error);
  revalidatePath(`/equipe/clientes/${clienteId}`);
}

// ---------------- Viagens ----------------

function camposViagem(fd: FormData) {
  return {
    titulo: v.obrigatorio(fd, "titulo", 160),
    destino: v.texto(fd, "destino", 160),
    data_ida: v.data(fd, "data_ida"),
    data_volta: v.data(fd, "data_volta"),
    viajantes: v.texto(fd, "viajantes", 120),
    pacote: v.texto(fd, "pacote", 20) ? v.escolha(fd, "pacote", PACOTES, "completo") : null,
    orcamento_teto: v.numero(fd, "orcamento_teto"),
    mensagem: v.texto(fd, "mensagem", 4000),
  };
}

export async function criarViagem(fd: FormData) {
  await exigirEquipe();
  const clienteId = v.id(fd, "cliente_id");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("viagens")
    .insert({ cliente_id: clienteId, ...camposViagem(fd) })
    .select("id")
    .single();
  falhou(error);
  redirect(`/equipe/viagens/${data!.id}?ok=viagem-criada`);
}

export async function atualizarViagem(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("viagens")
    .update({ ...camposViagem(fd), atualizado_em: new Date().toISOString() })
    .eq("id", viagemId);
  falhou(error);
  revalidatePath(`/equipe/viagens/${viagemId}`);
  redirect(`/equipe/viagens/${viagemId}?ok=viagem-salva`);
}

export async function mudarStatusViagem(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("viagens")
    .update({ status: v.escolha(fd, "status", STATUS, "rascunho"), atualizado_em: new Date().toISOString() })
    .eq("id", viagemId);
  falhou(error);
  revalidatePath(`/equipe/viagens/${viagemId}`);
}

export async function excluirViagem(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const clienteId = v.id(fd, "cliente_id");
  if (v.texto(fd, "confirmar", 10) !== "sim") throw new Error("Confirme a exclusão marcando a caixa.");
  const supabase = await createClient();
  const { error } = await supabase.from("viagens").delete().eq("id", viagemId);
  falhou(error);
  redirect(`/equipe/clientes/${clienteId}`);
}

// ---------------- Itens ----------------

async function tocarViagem(viagemId: string) {
  const supabase = await createClient();
  await supabase.from("viagens").update({ atualizado_em: new Date().toISOString() }).eq("id", viagemId);
  revalidatePath(`/equipe/viagens/${viagemId}`);
}

export async function adicionarItem(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const milhas = v.numero(fd, "milhas");
  const { error } = await supabase.from("itens_viagem").insert({
    viagem_id: viagemId,
    tipo: v.escolha(fd, "tipo", TIPOS, "outro"),
    titulo: v.obrigatorio(fd, "titulo", 200),
    descricao: v.texto(fd, "descricao", 4000),
    data: v.data(fd, "data"),
    hora: v.hora(fd, "hora"),
    data_fim: v.data(fd, "data_fim"),
    local: v.texto(fd, "local", 200),
    preco: v.numero(fd, "preco"),
    preco_ref: "total",
    milhas: milhas !== null ? Math.round(milhas) : null,
    programa: v.texto(fd, "programa", 80),
    taxas: v.numero(fd, "taxas"),
    link_compra: v.link(fd, "link_compra"),
    fonte: v.texto(fd, "fonte", 200) ?? "cotação manual",
    consultado_em: new Date().toISOString(),
    situacao: v.escolha(fd, "situacao", SITUACOES, "sugestao"),
    visivel_cliente: fd.get("visivel_cliente") === "on",
  });
  falhou(error);
  await tocarViagem(viagemId);
  redirect(`/equipe/viagens/${viagemId}?ok=item-adicionado#itens`);
}

// Recebe um resultado de busca (voo ou hospedagem) já resumido pelo formulário da busca.
export async function adicionarDaBusca(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  let dados: unknown = null;
  try {
    dados = JSON.parse(v.texto(fd, "dados", 20000) ?? "null");
  } catch {
    dados = null;
  }
  const { error } = await supabase.from("itens_viagem").insert({
    viagem_id: viagemId,
    tipo: v.escolha(fd, "tipo", ["voo", "hospedagem"] as const, "voo"),
    titulo: v.obrigatorio(fd, "titulo", 200),
    descricao: v.texto(fd, "descricao", 4000),
    data: v.data(fd, "data"),
    hora: v.hora(fd, "hora"),
    data_fim: v.data(fd, "data_fim"),
    local: v.texto(fd, "local", 200),
    preco: v.numero(fd, "preco"),
    preco_ref: "total",
    link_compra: v.link(fd, "link_compra"),
    fonte: v.texto(fd, "fonte", 200),
    consultado_em: v.texto(fd, "consultado_em", 40) ?? new Date().toISOString(),
    situacao: "sugestao",
    visivel_cliente: true,
    dados,
  });
  falhou(error);
  await tocarViagem(viagemId);
  redirect(`/equipe/viagens/${viagemId}?ok=item-adicionado#itens`);
}

export async function atualizarItem(fd: FormData) {
  await exigirEquipe();
  const itemId = v.id(fd, "item_id");
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const mudancas: Record<string, unknown> = {};
  if (fd.has("situacao")) mudancas.situacao = v.escolha(fd, "situacao", SITUACOES, "sugestao");
  if (fd.has("visivel")) mudancas.visivel_cliente = fd.get("visivel") === "sim";
  const { error } = await supabase.from("itens_viagem").update(mudancas).eq("id", itemId).eq("viagem_id", viagemId);
  falhou(error);
  await tocarViagem(viagemId);
}

export async function excluirItem(fd: FormData) {
  await exigirEquipe();
  const itemId = v.id(fd, "item_id");
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase.from("itens_viagem").delete().eq("id", itemId).eq("viagem_id", viagemId);
  falhou(error);
  await tocarViagem(viagemId);
}

// ---------------- Checklist ----------------

export async function adicionarChecklist(fd: FormData) {
  await exigirEquipe();
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_viagem").insert({
    viagem_id: viagemId,
    texto: v.obrigatorio(fd, "texto", 400),
    estado: v.escolha(fd, "estado", ESTADOS, "pendente"),
    fonte_url: v.link(fd, "fonte_url"),
  });
  falhou(error);
  await tocarViagem(viagemId);
}

export async function mudarChecklist(fd: FormData) {
  await exigirEquipe();
  const itemId = v.id(fd, "item_id");
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_viagem")
    .update({ estado: v.escolha(fd, "estado", ESTADOS, "pendente") })
    .eq("id", itemId)
    .eq("viagem_id", viagemId);
  falhou(error);
  await tocarViagem(viagemId);
}

export async function excluirChecklist(fd: FormData) {
  await exigirEquipe();
  const itemId = v.id(fd, "item_id");
  const viagemId = v.id(fd, "viagem_id");
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_viagem").delete().eq("id", itemId).eq("viagem_id", viagemId);
  falhou(error);
  await tocarViagem(viagemId);
}
