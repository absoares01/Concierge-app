export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function adminConfigurado(): boolean {
  return supabaseConfigurado() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function urlDoApp(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
