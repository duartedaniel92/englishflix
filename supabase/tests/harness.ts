import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { moddatetime } from "@electric-sql/pglite/contrib/moddatetime";

const MIGRATIONS = fileURLToPath(new URL("../migrations", import.meta.url));

// Dublê do que o Supabase já traz pronto: papéis, privilégios padrão do schema public,
// schema extensions e o essencial do auth. auth.uid()/auth.jwt() têm o mesmo corpo do Supabase:
// leem o JWT que o PostgREST grava em request.jwt.claims a cada requisição.
const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_app_meta_data jsonb not null default '{}',
    raw_user_meta_data jsonb not null default '{}',
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
  $$;
`;

export interface User {
  id: string;
  claims: Record<string, unknown>;
}

let instance: Promise<PGlite> | undefined;

/** Banco único por execução: o PGlite demora a iniciar, então todos os arquivos o compartilham. */
export function database(): Promise<PGlite> {
  instance ??= start();
  return instance;
}

async function start(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { moddatetime } });
  await db.exec(SUPABASE_STUB);
  const files = existsSync(MIGRATIONS) ? readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort() : [];
  for (const file of files) {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  return db;
}

/** Cria um usuário como o cadastro do Supabase faria e devolve as claims do JWT dele. */
export async function createUser(
  db: PGlite,
  options: { admin?: boolean; userMetadata?: Record<string, unknown> } = {},
): Promise<User> {
  const id = randomUUID();
  const appMetadata = options.admin ? { role: "admin" } : {};
  const userMetadata = options.userMetadata ?? {};
  await db.query(
    "insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values ($1, $2, $3::jsonb, $4::jsonb)",
    [id, `${id}@teste.invalid`, JSON.stringify(appMetadata), JSON.stringify(userMetadata)],
  );
  return { id, claims: { sub: id, role: "authenticated", app_metadata: appMetadata, user_metadata: userMetadata } };
}

/** Roda `fn` numa transação com o papel e o JWT de quem chama, como o PostgREST faz em cada requisição. */
export function as<T>(db: PGlite, who: User | "anon", fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const role = who === "anon" ? "anon" : "authenticated";
  const claims = who === "anon" ? { role } : who.claims;
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await tx.exec(`set local role ${role}`);
    return fn(tx);
  });
}
