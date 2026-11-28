import { describe, expect, it } from "vitest";
import { as, createUser, database } from "./harness";

describe("harness do banco", () => {
  it("roda como aluno com o auth.uid() vindo do JWT, como o Supabase", async () => {
    const db = await database();
    const student = await createUser(db);

    const { rows } = await as(db, student, (tx) =>
      tx.query<{ uid: string; role: string }>("select auth.uid() as uid, current_user as role"),
    );

    expect(rows[0]).toEqual({ uid: student.id, role: "authenticated" });
  });

  it("roda como visitante sem usuário", async () => {
    const db = await database();

    const { rows } = await as(db, "anon", (tx) =>
      tx.query<{ uid: string | null; role: string }>("select auth.uid() as uid, current_user as role"),
    );

    expect(rows[0]).toEqual({ uid: null, role: "anon" });
  });

  it("desfaz o papel e o JWT ao fim de cada chamada", async () => {
    const db = await database();
    await as(db, await createUser(db), (tx) => tx.query("select 1"));

    const { rows } = await db.query<{ uid: string | null; role: string }>(
      "select auth.uid() as uid, current_user as role",
    );

    expect(rows[0]).toEqual({ uid: null, role: "postgres" });
  });
});
