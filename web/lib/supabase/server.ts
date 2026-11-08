import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieParaGravar = { name: string; value: string; options?: object };

// Cliente do Supabase com a sessão de quem está logado. As regras do banco (RLS)
// valem aqui: a equipe vê tudo, o cliente só as próprias viagens publicadas.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(lista: CookieParaGravar[]) {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }));
        } catch {
          // Chamado de um Server Component: o middleware renova a sessão.
        }
      },
    },
  });
}
