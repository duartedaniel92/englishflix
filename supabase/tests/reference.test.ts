import { describe, expect, it } from "vitest";
import { as, createUser, database } from "./harness";

describe("dados de referência", () => {
  it("traz os níveis B1 a C2 em ordem, as categorias iniciais e os valores de XP", async () => {
    const db = await database();
    const student = await createUser(db);

    const levels = await as(db, student, (tx) =>
      tx.query("select code from public.levels where code in ('B1', 'B2', 'C1', 'C2') order by position"),
    );
    const categories = await as(db, student, (tx) =>
      tx.query("select name from public.categories where slug in ('daily-life', 'business', 'travel') order by name"),
    );
    const xp = await as(db, student, (tx) => tx.query("select kind, amount from public.xp_config order by kind"));

    expect(levels.rows).toEqual([{ code: "B1" }, { code: "B2" }, { code: "C1" }, { code: "C2" }]);
    expect(categories.rows).toEqual([{ name: "Business" }, { name: "Daily Life" }, { name: "Travel" }]);
    expect(xp.rows).toEqual([
      { kind: "episode", amount: 10 },
      { kind: "exam", amount: 20 },
      { kind: "quiz", amount: 5 },
      { kind: "review", amount: 1 },
      { kind: "season", amount: 100 },
    ]);
  });
});
