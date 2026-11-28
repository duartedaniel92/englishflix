import type { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { as, createUser, database, type User } from "./harness";

const isAdmin = async (db: PGlite, who: User): Promise<boolean | undefined> => {
  const { rows } = await as(db, who, (tx) => tx.query<{ ok: boolean }>("select private.is_admin() as ok"));
  return rows[0]?.ok;
};

describe("guardas gerais", () => {
  it("toda tabela do schema public tem RLS ligado", async () => {
    const db = await database();
    const { rows } = await db.query<{ name: string; rls: boolean }>(
      `select c.relname as name, c.relrowsecurity as rls
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`,
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((table) => !table.rls)).toEqual([]);
  });

  it("visitante não lê nenhuma tabela do schema public", async () => {
    const db = await database();
    const { rows } = await db.query<{ name: string }>("select tablename as name from pg_tables where schemaname = 'public'");

    for (const { name } of rows) {
      await expect(as(db, "anon", (tx) => tx.query(`select 1 from public."${name}" limit 1`)), name).rejects.toMatchObject({
        code: "42501",
      });
    }
  });

  it("visitante não executa nenhuma função dos schemas public e private", async () => {
    const db = await database();
    const { rows } = await db.query<{ name: string }>(
      `select p.oid::regprocedure::text as name
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'private') and has_function_privilege('anon', p.oid, 'execute')`,
    );

    expect(rows).toEqual([]);
  });
});

describe("perfil do aluno", () => {
  it("o cadastro cria o perfil com o nome limitado a 60 caracteres", async () => {
    const db = await database();
    const user = await createUser(db, { userMetadata: { display_name: `  ${"A".repeat(80)}  ` } });

    const { rows } = await db.query("select display_name, xp, terms_version, consented_at from public.profiles where id = $1", [
      user.id,
    ]);

    expect(rows).toEqual([{ display_name: "A".repeat(60), xp: 0, terms_version: null, consented_at: null }]);
  });

  it("registra o aceite dos termos com a hora do servidor", async () => {
    const db = await database();
    const user = await createUser(db, { userMetadata: { display_name: "Ana", terms_version: "2026-11" } });

    const { rows } = await db.query<{ terms_version: string; consented_at: Date | null }>(
      "select terms_version, consented_at from public.profiles where id = $1",
      [user.id],
    );

    expect(rows[0]?.terms_version).toBe("2026-11");
    expect(rows[0]?.consented_at).toBeInstanceOf(Date);
  });

  it("aluno lê e edita só o próprio perfil, e não mexe no XP", async () => {
    const db = await database();
    const ana = await createUser(db, { userMetadata: { display_name: "Ana" } });
    const bia = await createUser(db, { userMetadata: { display_name: "Bia" } });

    const visible = await as(db, ana, (tx) => tx.query("select id from public.profiles"));
    expect(visible.rows).toEqual([{ id: ana.id }]);

    await as(db, ana, (tx) =>
      tx.query("update public.profiles set display_name = 'Ana Lima', weekly_goal_minutes = 90 where id = $1", [ana.id]),
    );
    await expect(
      as(db, ana, (tx) => tx.query("update public.profiles set xp = 9999 where id = $1", [ana.id])),
    ).rejects.toMatchObject({ code: "42501" });
    const other = await as(db, ana, (tx) =>
      tx.query("update public.profiles set display_name = 'invasão' where id = $1", [bia.id]),
    );
    expect(other.affectedRows).toBe(0);

    const { rows } = await db.query("select id, display_name, weekly_goal_minutes, xp from public.profiles where id in ($1, $2) order by display_name", [
      ana.id,
      bia.id,
    ]);
    expect(rows).toEqual([
      { id: ana.id, display_name: "Ana Lima", weekly_goal_minutes: 90, xp: 0 },
      { id: bia.id, display_name: "Bia", weekly_goal_minutes: 60, xp: 0 },
    ]);
  });
});

describe("papel de admin", () => {
  it("vem só do app_metadata; um 'admin' no user_metadata não vale", async () => {
    const db = await database();

    expect(await isAdmin(db, await createUser(db, { admin: true }))).toBe(true);
    expect(await isAdmin(db, await createUser(db, { userMetadata: { role: "admin" } }))).toBe(false);
    expect(await isAdmin(db, await createUser(db))).toBe(false);
  });
});
