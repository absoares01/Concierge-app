import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Exige login em todas as páginas, exceto /login e /auth/*. O papel (equipe ou
// cliente) é conferido nas próprias áreas e, principalmente, pelas regras do banco.

type CookieParaGravar = { name: string; value: string; options?: object };

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const publica = path === "/login" || path.startsWith("/auth/") || path === "/configurar";

  if (!url || !anon) {
    // Sem Supabase não há login nem dados: mostra a página de configuração.
    if (publica) return NextResponse.next();
    const destino = request.nextUrl.clone();
    destino.pathname = "/configurar";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista: CookieParaGravar[]) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (publica) return response;

  if (!user) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
