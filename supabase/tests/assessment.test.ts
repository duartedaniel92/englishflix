import type { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { createEpisode, createSeason } from "./fixtures";
import { as, createUser, database } from "./harness";

const insertId = async (db: PGlite, sql: string, params: unknown[]): Promise<string | undefined> =>
  (await db.query<{ id: string }>(sql, params)).rows[0]?.id;

const mcqQuestion = (db: PGlite, seasonId: string) =>
  insertId(db, "insert into public.exam_questions (season_id, type, prompt, options) values ($1, 'mcq', 'Pick one', '[\"a\", \"b\"]') returning id", [
    seasonId,
  ]);

describe("questões e gabaritos para o aluno", () => {
  it("mostra as questões do quiz de episódio publicado, que não trazem a resposta", async () => {
    const db = await database();
    const student = await createUser(db);
    const season = await createSeason(db);
    const published = await createEpisode(db, season);
    const draft = await createEpisode(db, season, { status: "draft" });
    await db.query(
      "insert into public.quiz_questions (episode_id, position, prompt, options) values ($1, 1, 'Visível?', '[\"sim\", \"não\"]'), ($2, 1, 'Oculta?', '[\"sim\", \"não\"]')",
      [published, draft],
    );

    const { rows } = await as(db, student, (tx) =>
      tx.query("select * from public.quiz_questions where episode_id in ($1, $2)", [published, draft]),
    );

    expect(rows.map((row) => (row as { prompt: string }).prompt)).toEqual(["Visível?"]);
    expect(Object.keys(rows[0] ?? {})).not.toContain("correct_option");
  });

  it("não deixa o aluno ver gabaritos nem o banco de questões da prova", async () => {
    const db = await database();
    const student = await createUser(db);
    const season = await createSeason(db);
    const episode = await createEpisode(db, season);
    const quiz = await insertId(
      db,
      "insert into public.quiz_questions (episode_id, position, prompt, options) values ($1, 1, 'Q', '[\"a\", \"b\"]') returning id",
      [episode],
    );
    await db.query("insert into public.quiz_answer_keys (question_id, correct_option) values ($1, 1)", [quiz]);
    const exam = await mcqQuestion(db, season);
    await db.query("insert into public.exam_answer_keys (question_id, correct_option) values ($1, 0)", [exam]);

    for (const table of ["quiz_answer_keys", "exam_questions", "exam_answer_keys"]) {
      const { rows } = await as(db, student, (tx) => tx.query(`select * from public.${table}`));
      expect(rows, table).toEqual([]);
    }
    await expect(
      as(db, student, (tx) => tx.query("insert into public.quiz_answer_keys (question_id, correct_option) values ($1, 0)", [quiz])),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("questões e gabaritos para o admin", () => {
  it("o admin lê e escreve gabaritos, e a auditoria não guarda a resposta", async () => {
    const db = await database();
    const admin = await createUser(db, { admin: true });
    const season = await createSeason(db);

    const question = await as(db, admin, async (tx) => {
      const created = await tx.query<{ id: string }>(
        "insert into public.exam_questions (season_id, type, prompt) values ($1, 'cloze', 'I ___ coffee') returning id",
        [season],
      );
      const id = created.rows[0]?.id;
      await tx.query("insert into public.exam_answer_keys (question_id, accepted_answers) values ($1, array['like'])", [id]);
      await tx.query("update public.exam_answer_keys set accepted_answers = array['like', 'love'] where question_id = $1", [id]);
      return id;
    });

    const keys = await as(db, admin, (tx) =>
      tx.query("select accepted_answers from public.exam_answer_keys where question_id = $1", [question]),
    );
    const log = await db.query<{ meta: unknown }>(
      "select meta from public.audit_log where entity = 'exam_answer_keys' and action = 'update' and actor_id = $1",
      [admin.id],
    );

    expect(keys.rows).toEqual([{ accepted_answers: ["like", "love"] }]);
    expect(log.rows).toEqual([{ meta: { changed: ["accepted_answers"] } }]);
    expect(JSON.stringify(log.rows)).not.toContain("love");
  });
});

describe("forma das questões", () => {
  it("cada questão é de uma temporada ou do nivelamento, nunca dos dois nem de nenhum", async () => {
    const db = await database();
    const season = await createSeason(db);
    const { rows } = await db.query<{ level_id: string }>("select level_id from public.seasons where id = $1", [season]);
    const level = rows[0]?.level_id;

    await expect(
      db.query("insert into public.exam_questions (season_id, placement_level_id, type, prompt) values ($1, $2, 'cloze', 'x')", [season, level]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(db.query("insert into public.exam_questions (type, prompt) values ('cloze', 'x')")).rejects.toMatchObject({ code: "23514" });
  });

  it("listening exige o trecho do vídeo, e múltipla escolha exige opções", async () => {
    const db = await database();
    const season = await createSeason(db);

    await expect(
      db.query("insert into public.exam_questions (season_id, type, prompt, options) values ($1, 'listening', 'x', '[\"a\", \"b\"]')", [season]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(db.query("insert into public.exam_questions (season_id, type, prompt) values ($1, 'mcq', 'x')", [season])).rejects.toMatchObject({
      code: "23514",
    });
  });

  it("o gabarito da prova tem uma forma só: a opção certa ou as respostas aceitas", async () => {
    const db = await database();
    const question = await mcqQuestion(db, await createSeason(db));

    await expect(
      db.query("insert into public.exam_answer_keys (question_id, correct_option, accepted_answers) values ($1, 0, array['a'])", [question]),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
