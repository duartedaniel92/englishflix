import { z } from "zod";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]+$/;
const SECRET_KEY = /^sb_secret_[A-Za-z0-9_-]+$/;

const supabaseUrl = z.url().refine((value) => {
  const url = new URL(value);
  // http só para o Supabase local; fora dele a chave trafegaria sem criptografia.
  const safeTransport =
    url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname));
  return safeTransport && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/";
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().max(4096).regex(PUBLISHABLE_KEY),
});

export type PublicEnv = z.infer<typeof publicSchema>;

function isSecretKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) return true;
  // Chave legada: JWT cujo payload declara o papel service_role.
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return false;
  try {
    const claims: unknown = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof claims === "object" && claims !== null && "role" in claims && claims.role === "service_role";
  } catch {
    return false;
  }
}

/**
 * Falha se alguma variável NEXT_PUBLIC_* guardar uma chave secreta do Supabase.
 * Roda no next.config.ts: o build para antes de o Next copiar o valor para o JavaScript do navegador.
 */
export function assertNoPublicSecrets(): void {
  const exposed = Object.entries(process.env)
    .filter(([name, value]) => name.startsWith("NEXT_PUBLIC_") && value !== undefined && isSecretKey(value))
    .map(([name]) => name);
  if (exposed.length > 0) {
    throw new Error(`Chave secreta do Supabase em variável pública: ${exposed.join(", ")}. Remova antes do build.`);
  }
}

/** Variáveis públicas do Supabase (podem ir para o navegador). */
export function publicEnv(): PublicEnv {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!result.success) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (chave publicável).");
  }
  return result.data;
}

/** Chave secreta do Supabase. Só pode ser usada em código de servidor. */
export function serverSecretKey(): string {
  const result = z.string().regex(SECRET_KEY).safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!result.success) throw new Error("Configure SUPABASE_SECRET_KEY (chave secreta, só no servidor).");
  return result.data;
}
