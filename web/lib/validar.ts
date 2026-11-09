// Leitura segura dos formulários (tudo vem como texto).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function texto(fd: FormData, campo: string, max = 2000): string | null {
  const v = fd.get(campo);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t === "" ? null : t;
}

export function obrigatorio(fd: FormData, campo: string, max = 300): string {
  const t = texto(fd, campo, max);
  if (!t) throw new Error(`Preencha o campo "${campo}".`);
  return t;
}

export function id(fd: FormData, campo: string): string {
  const v = texto(fd, campo, 40);
  if (!v || !UUID.test(v)) throw new Error("Identificador inválido.");
  return v;
}

export function idOpcional(fd: FormData, campo: string): string | null {
  const v = texto(fd, campo, 40);
  return v && UUID.test(v) ? v : null;
}

export function uuidOuNulo(v: string | null | undefined): string | null {
  return v && UUID.test(v) ? v : null;
}

export function numero(fd: FormData, campo: string): number | null {
  const t = texto(fd, campo, 40);
  if (!t) return null;
  // aceita "1.234,56" e "1234.56"
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  const n = Number(normal.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function data(fd: FormData, campo: string): string | null {
  const t = texto(fd, campo, 10);
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

export function hora(fd: FormData, campo: string): string | null {
  const t = texto(fd, campo, 5);
  return t && /^\d{2}:\d{2}$/.test(t) ? t : null;
}

export function escolha<T extends string>(fd: FormData, campo: string, opcoes: readonly T[], padrao: T): T {
  const t = texto(fd, campo, 40);
  return t && (opcoes as readonly string[]).includes(t) ? (t as T) : padrao;
}

// Só aceita links http(s): bloqueia "javascript:" e afins.
export function link(fd: FormData, campo: string): string | null {
  return linkSeguro(texto(fd, campo, 2000));
}

export function linkSeguro(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function iata(v: string | null): string | null {
  if (!v) return null;
  const lista = v
    .toUpperCase()
    .split(/[,\s]+/)
    .filter((c) => /^[A-Z]{3}$/.test(c));
  return lista.length ? lista.slice(0, 4).join(",") : null;
}
