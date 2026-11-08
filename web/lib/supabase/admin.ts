import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com a chave de serviço: ignora as regras do banco. SOMENTE no servidor e
// SOMENTE depois de confirmar que quem pede é da equipe (ver lib/auth.ts).
// Uso atual: criar o login de um cliente.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
