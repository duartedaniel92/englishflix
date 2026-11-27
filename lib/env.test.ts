import { afterEach, describe, expect, it, vi } from "vitest";
import { assertNoPublicSecrets, publicEnv, serverSecretKey } from "./env";

// Valores falsos e de baixa entropia: não são credenciais.
const PUBLISHABLE = "sb_publishable_fake_key_for_tests";
const SECRET = "sb_secret_fake_key_for_tests";

function legacyJwt(role: string): string {
  const part = (data: object): string => btoa(JSON.stringify(data)).replace(/=+$/, "");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part({ role })}.assinatura`;
}

function stubPublic(url: string, key: string): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicEnv", () => {
  it("aceita URL https e chave publicável", () => {
    stubPublic("https://abc.supabase.co", PUBLISHABLE);
    expect(publicEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
    });
  });

  it("aceita http apenas para o Supabase local", () => {
    stubPublic("http://127.0.0.1:54321", PUBLISHABLE);
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");

    stubPublic("http://abc.supabase.co", PUBLISHABLE);
    expect(() => publicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("recusa a chave secreta no lugar da publicável", () => {
    stubPublic("https://abc.supabase.co", SECRET);
    expect(() => publicEnv()).toThrow(/chave publicável/);
  });
});

describe("assertNoPublicSecrets", () => {
  it("passa quando as variáveis públicas não guardam segredo", () => {
    stubPublic("https://abc.supabase.co", PUBLISHABLE);
    expect(() => assertNoPublicSecrets()).not.toThrow();
  });

  it("aponta a variável que guarda a chave secreta, sem mostrar o valor", () => {
    vi.stubEnv("NEXT_PUBLIC_QUALQUER_COISA", SECRET);
    expect(() => assertNoPublicSecrets()).toThrow(/NEXT_PUBLIC_QUALQUER_COISA/);
    expect(() => assertNoPublicSecrets()).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(SECRET) }),
    );
  });

  it("reconhece a chave legada service_role, mas não a anon", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", legacyJwt("service_role"));
    expect(() => assertNoPublicSecrets()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", legacyJwt("anon"));
    expect(() => assertNoPublicSecrets()).not.toThrow();
  });
});

describe("serverSecretKey", () => {
  it("devolve a chave secreta configurada", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", SECRET);
    expect(serverSecretKey()).toBe(SECRET);
  });

  it("falha sem a chave ou com a chave errada", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(() => serverSecretKey()).toThrow(/SUPABASE_SECRET_KEY/);

    vi.stubEnv("SUPABASE_SECRET_KEY", PUBLISHABLE);
    expect(() => serverSecretKey()).toThrow(/SUPABASE_SECRET_KEY/);
  });
});
