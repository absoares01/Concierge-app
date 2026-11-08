// Testa as regras de segurança do banco (supabase/schema.sql) num Postgres local
// em memória (PGlite), simulando o Supabase: papéis anon/authenticated e auth.uid().
// Rode com: npm run test:rls
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const EQUIPE = "11111111-1111-1111-1111-111111111111";
const ANA = "22222222-2222-2222-2222-222222222222"; // cliente com viagem
const BRUNO = "33333333-3333-3333-3333-333333333333"; // outro cliente

let falhas = 0;
function confere(nome: string, ok: boolean, detalhe = "") {
  console.log(`${ok ? "✓" : "✗"} ${nome}${!ok && detalhe ? ` — ${detalhe}` : ""}`);
  if (!ok) falhas++;
}

async function main() {
  const db = new PGlite();

  // --- Simulação mínima do Supabase ---
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);

  const schema = readFileSync(join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  await db.exec(schema);

  // O Supabase concede acesso às tabelas; quem filtra são as regras (RLS).
  await db.exec(`
    grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to anon;
    revoke all on public.perfis, public.clientes, public.viagens, public.itens_viagem, public.checklist_viagem from anon;
  `);

  // --- Dados (como administrador) ---
  await db.exec(`
    insert into auth.users (id, email) values
      ('${EQUIPE}', 'equipe@soares.test'), ('${ANA}', 'ana@cliente.test'), ('${BRUNO}', 'bruno@cliente.test');
    update public.perfis set papel = 'equipe' where user_id = '${EQUIPE}';
    insert into public.clientes (id, nome, email, notas_internas, user_id) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'Ana', 'ana@cliente.test', 'segredo da equipe', '${ANA}'),
      ('aaaaaaaa-0000-0000-0000-000000000002', 'Bruno', 'bruno@cliente.test', 'outro segredo', '${BRUNO}');
    insert into public.viagens (id, cliente_id, titulo, status) values
      ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Lisboa publicada', 'publicada'),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Rascunho da Ana', 'rascunho'),
      ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'Viagem do Bruno', 'publicada');
    insert into public.itens_viagem (viagem_id, tipo, titulo, visivel_cliente) values
      ('bbbbbbbb-0000-0000-0000-000000000001', 'voo', 'Voo visível', true),
      ('bbbbbbbb-0000-0000-0000-000000000001', 'voo', 'Opção escondida', false),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'voo', 'Item do rascunho', true),
      ('bbbbbbbb-0000-0000-0000-000000000003', 'voo', 'Item do Bruno', true);
    insert into public.checklist_viagem (viagem_id, texto) values
      ('bbbbbbbb-0000-0000-0000-000000000001', 'Passaporte'),
      ('bbbbbbbb-0000-0000-0000-000000000003', 'Visto do Bruno');
  `);

  async function como(user: string | null, sql: string) {
    await db.exec("reset role;");
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ""]);
    await db.exec(`set role ${user ? "authenticated" : "anon"};`);
    try {
      return { rows: (await db.query<Record<string, unknown>>(sql)).rows, erro: null as string | null };
    } catch (e) {
      return { rows: [] as Record<string, unknown>[], erro: (e as Error).message };
    } finally {
      await db.exec("reset role;");
    }
  }

  // --- Cliente Ana ---
  let r = await como(ANA, "select titulo from public.viagens order by titulo");
  confere("Cliente vê só a própria viagem publicada", JSON.stringify(r.rows.map((x) => x.titulo)) === '["Lisboa publicada"]', JSON.stringify(r));

  r = await como(ANA, "select titulo from public.itens_viagem order by titulo");
  confere("Cliente vê só itens visíveis da viagem publicada", JSON.stringify(r.rows.map((x) => x.titulo)) === '["Voo visível"]', JSON.stringify(r));

  r = await como(ANA, "select texto from public.checklist_viagem");
  confere("Cliente vê só o próprio checklist", JSON.stringify(r.rows.map((x) => x.texto)) === '["Passaporte"]', JSON.stringify(r));

  r = await como(ANA, "select notas_internas from public.clientes");
  confere("Cliente não lê a tabela de clientes (notas internas)", r.rows.length === 0, JSON.stringify(r));

  r = await como(ANA, "update public.viagens set titulo = 'hackeado' returning id");
  confere("Cliente não altera viagens", r.rows.length === 0 || r.erro !== null, JSON.stringify(r));

  r = await como(ANA, `insert into public.itens_viagem (viagem_id, tipo, titulo) values ('bbbbbbbb-0000-0000-0000-000000000001', 'outro', 'invasão') returning id`);
  confere("Cliente não cria itens", r.erro !== null, JSON.stringify(r));

  r = await como(ANA, "delete from public.itens_viagem returning id");
  confere("Cliente não apaga itens", r.rows.length === 0, JSON.stringify(r));

  r = await como(ANA, `update public.perfis set papel = 'equipe' where user_id = '${ANA}' returning papel`);
  confere("Cliente não se promove a equipe", r.rows.length === 0, JSON.stringify(r));

  r = await como(ANA, `update public.clientes set user_id = '${ANA}' where nome = 'Bruno' returning id`);
  confere("Cliente não se associa à viagem de outro", r.rows.length === 0, JSON.stringify(r));

  r = await como(ANA, "select user_id, papel from public.perfis");
  confere("Cliente lê só o próprio perfil", r.rows.length === 1 && r.rows[0].user_id === ANA, JSON.stringify(r));

  // --- Outro cliente ---
  r = await como(BRUNO, "select titulo from public.viagens");
  confere("Outro cliente não vê viagens da Ana", JSON.stringify(r.rows.map((x) => x.titulo)) === '["Viagem do Bruno"]', JSON.stringify(r));

  // --- Visitante sem login ---
  r = await como(null, "select id from public.viagens");
  confere("Visitante sem login não lê nada", r.rows.length === 0, JSON.stringify(r));

  // --- Equipe ---
  r = await como(EQUIPE, "select count(*)::int as n from public.viagens");
  confere("Equipe vê todas as viagens", r.rows[0]?.n === 3, JSON.stringify(r));

  r = await como(EQUIPE, "select count(*)::int as n from public.itens_viagem");
  confere("Equipe vê todos os itens, inclusive escondidos", r.rows[0]?.n === 4, JSON.stringify(r));

  r = await como(EQUIPE, "select notas_internas from public.clientes where nome = 'Ana'");
  confere("Equipe lê notas internas", r.rows[0]?.notas_internas === "segredo da equipe", JSON.stringify(r));

  r = await como(EQUIPE, `insert into public.itens_viagem (viagem_id, tipo, titulo) values ('bbbbbbbb-0000-0000-0000-000000000002', 'hospedagem', 'Hotel') returning id`);
  confere("Equipe cria itens", r.rows.length === 1, JSON.stringify(r));

  r = await como(EQUIPE, "update public.viagens set status = 'publicada' where titulo = 'Rascunho da Ana' returning id");
  confere("Equipe publica viagem", r.rows.length === 1, JSON.stringify(r));

  r = await como(ANA, "select count(*)::int as n from public.viagens");
  confere("Depois de publicada, a cliente passa a ver a viagem", r.rows[0]?.n === 2, JSON.stringify(r));

  // --- Novo login nasce como cliente ---
  await db.exec(`insert into auth.users (id, email) values ('44444444-4444-4444-4444-444444444444', 'novo@x.test')`);
  const p = await db.query<{ papel: string }>(`select papel from public.perfis where user_id = '44444444-4444-4444-4444-444444444444'`);
  confere("Login novo nasce com papel cliente", p.rows[0]?.papel === "cliente", JSON.stringify(p.rows));

  console.log(falhas === 0 ? "\nTodas as regras passaram." : `\n${falhas} regra(s) falharam.`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
