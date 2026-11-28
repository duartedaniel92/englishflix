import type { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { createEpisode, createLevel, createSeason } from "./fixtures";
import { as, createUser, database, type User } from "./harness";

const STUDENT_TABLES = [
  "user_season_state",
  "episode_progress",
  "flashcard_reviews",
  "my_list",
  "exam_attempts",
  "xp_events",
  "user_badges",
  "certificates",
  "video_reports",
];

const count = async (db: PGlite, who: User, table: string): Promise<number> =>
  (await as(db, who, (tx) => tx.query(`select 1 from public.${table}`))).rows.length;

/** Uma linha de cada tabela do aluno para `owner`, criada pelo servidor. */
async function giveEverything(db: PGlite, owner: User): Promise<void> {
  const level = await createLevel(db);
  const season = await createSeason(db, { levelId: level });
  const episode = await createEpisode(db, season);
  const vocab = await db.query<{ id: string }>(
    "insert into public.vocabulary (episode_id, term, definition_pt) values ($1, 'hang out', 'sair') returning id",
    [episode],
  );
  const badge = await db.query<{ id: string }>("insert into public.badges (code, name, season_id) values ($1, 'Medalha', $2) returning id", [
    `medalha-${season.slice(0, 8)}`,
    season,
  ]);
  const [user, vocabulary, badgeId] = [owner.id, vocab.rows[0]?.id, badge.rows[0]?.id];
  // Ids gerados pelo próprio teste: interpolar é seguro aqui.
  await db.exec(`
    insert into public.xp_config (kind, amount) values ('episode', 10) on conflict (kind) do nothing;
    insert into public.user_season_state (user_id, season_id, state, source) values ('${user}', '${season}', 'unlocked', 'start');
    insert into public.episode_progress (user_id, episode_id) values ('${user}', '${episode}');
    insert into public.flashcard_reviews (user_id, vocabulary_id) values ('${user}', '${vocabulary}');
    insert into public.my_list (user_id, season_id) values ('${user}', '${season}');
    insert into public.exam_attempts (user_id, season_id, question_ids, expires_at)
      values ('${user}', '${season}', array[gen_random_uuid()], now() + interval '30 minutes');
    insert into public.xp_events (user_id, kind, amount, ref_id) values ('${user}', 'episode', 10, '${episode}');
    insert into public.user_badges (user_id, badge_id) values ('${user}', '${badgeId}');
    insert into public.certificates (user_id, level_id, code) values ('${user}', '${level}', upper(substr(md5(random()::text), 1, 12)));
    insert into public.video_reports (user_id, episode_id, reason) values ('${user}', '${episode}', 'broken');
  `);
}

describe("dados de um aluno para outro", () => {
  it("cada aluno vê só o que é dele em todas as tabelas", async () => {
    const db = await database();
    const ana = await createUser(db);
    const bia = await createUser(db);
    await giveEverything(db, bia);

    for (const table of STUDENT_TABLES) {
      expect(await count(db, ana, table), `ana em ${table}`).toBe(0);
      expect(await count(db, bia, table), `bia em ${table}`).toBe(1);
    }
  });
});

describe("o que o aluno não escreve", () => {
  it("estado de temporada, XP, medalha e certificado só mudam pelo servidor", async () => {
    const db = await database();
    const ana = await createUser(db);
    const season = await createSeason(db);

    const attempts = [
      `insert into public.user_season_state (user_id, season_id, state, source) values ('${ana.id}', '${season}', 'completed', 'exam')`,
      `insert into public.xp_events (user_id, kind, amount, ref_id) values ('${ana.id}', 'episode', 9999, '${season}')`,
      `insert into public.user_badges (user_id, badge_id) values ('${ana.id}', gen_random_uuid())`,
      `insert into public.certificates (user_id, level_id, code) values ('${ana.id}', gen_random_uuid(), 'AAAAAAAAAAAA')`,
    ];
    for (const sql of attempts) {
      await expect(as(db, ana, (tx) => tx.query(sql)), sql).rejects.toMatchObject({ code: "42501" });
    }
  });

  it("nota da prova e conclusão do episódio não aceitam escrita direta", async () => {
    const db = await database();
    const ana = await createUser(db);
    await giveEverything(db, ana);

    await expect(as(db, ana, (tx) => tx.query("update public.exam_attempts set score = 100, passed = true"))).rejects.toMatchObject({
      code: "42501",
    });
    await expect(
      as(db, ana, (tx) => tx.query("update public.episode_progress set watched_pct = 100, completed_at = now()")),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("minha lista", () => {
  it("o aluno adiciona e remove temporadas visíveis; o dono vem da sessão", async () => {
    const db = await database();
    const ana = await createUser(db);
    const bia = await createUser(db);
    const season = await createSeason(db);
    const draft = await createSeason(db, { status: "draft" });

    await as(db, ana, (tx) => tx.query("insert into public.my_list (season_id) values ($1)", [season]));
    await expect(as(db, ana, (tx) => tx.query("insert into public.my_list (season_id) values ($1)", [draft]))).rejects.toMatchObject({
      code: "42501",
    });
    await expect(
      as(db, ana, (tx) => tx.query("insert into public.my_list (user_id, season_id) values ($1, $2)", [bia.id, season])),
    ).rejects.toMatchObject({ code: "42501" });

    const owner = await db.query("select user_id from public.my_list where season_id = $1", [season]);
    expect(owner.rows).toEqual([{ user_id: ana.id }]);
    const byOther = await as(db, bia, (tx) => tx.query("delete from public.my_list where season_id = $1", [season]));
    const byOwner = await as(db, ana, (tx) => tx.query("delete from public.my_list where season_id = $1", [season]));
    expect([byOther.affectedRows, byOwner.affectedRows]).toEqual([0, 1]);
  });
});

describe("tarefas livres do episódio", () => {
  it("shadowing e escrita só valem em temporada liberada para o aluno", async () => {
    const db = await database();
    const ana = await createUser(db);
    const season = await createSeason(db);
    const episode = await createEpisode(db, season);
    const write = () =>
      as(db, ana, (tx) =>
        tx.query("insert into public.episode_progress (episode_id, shadowing_done, writing_text) values ($1, true, 'I usually wake up early.')", [
          episode,
        ]),
      );

    await expect(write()).rejects.toMatchObject({ code: "42501" });
    await db.query("insert into public.user_season_state (user_id, season_id, state, source) values ($1, $2, 'unlocked', 'start')", [
      ana.id,
      season,
    ]);
    await write();

    const { rows } = await db.query("select user_id, shadowing_done, watched_pct from public.episode_progress where episode_id = $1", [episode]);
    expect(rows).toEqual([{ user_id: ana.id, shadowing_done: true, watched_pct: "0.00" }]);
  });
});

describe("rascunho da prova", () => {
  it("só na tentativa aberta, dentro do prazo e do próprio aluno", async () => {
    const db = await database();
    const ana = await createUser(db);
    const bia = await createUser(db);
    const season = await createSeason(db);
    const { rows } = await db.query<{ id: string }>(
      "insert into public.exam_attempts (user_id, season_id, question_ids, expires_at) values ($1, $2, array[gen_random_uuid()], now() + interval '30 minutes') returning id",
      [ana.id, season],
    );
    const attempt = rows[0]?.id;
    const save = (who: User) =>
      as(db, who, (tx) => tx.query(`update public.exam_attempts set answers = '{"q1": 2}' where id = $1`, [attempt]));

    expect((await save(ana)).affectedRows).toBe(1);
    expect((await save(bia)).affectedRows).toBe(0);
    await db.query("update public.exam_attempts set submitted_at = now(), score = 50, passed = false where id = $1", [attempt]);
    expect((await save(ana)).affectedRows).toBe(0);
  });

  it("tentativa vencida não aceita mais rascunho", async () => {
    const db = await database();
    const ana = await createUser(db);
    const season = await createSeason(db);
    await db.query(
      "insert into public.exam_attempts (user_id, season_id, question_ids, started_at, expires_at) values ($1, $2, array[gen_random_uuid()], now() - interval '2 hours', now() - interval '1 hour')",
      [ana.id, season],
    );

    const saved = await as(db, ana, (tx) => tx.query(`update public.exam_attempts set answers = '{"q1": 1}'`));
    expect(saved.affectedRows).toBe(0);
  });

  it("o banco garante uma só tentativa aberta por aluno", async () => {
    const db = await database();
    const ana = await createUser(db);
    const season = await createSeason(db);
    const open = () =>
      db.query(
        "insert into public.exam_attempts (user_id, season_id, question_ids, expires_at) values ($1, $2, array[gen_random_uuid()], now() + interval '30 minutes')",
        [ana.id, season],
      );

    await open();
    await expect(open()).rejects.toMatchObject({ code: "23505" });
  });
});

describe("denúncia de vídeo quebrado", () => {
  it("o aluno denuncia uma vez; o admin vê, resolve e fica auditado", async () => {
    const db = await database();
    const ana = await createUser(db);
    const bia = await createUser(db);
    const admin = await createUser(db, { admin: true });
    const episode = await createEpisode(db, await createSeason(db));
    const report = () =>
      as(db, ana, (tx) => tx.query("insert into public.video_reports (episode_id, reason, details) values ($1, 'removed', 'Vídeo indisponível')", [episode]));

    await report();
    await expect(report()).rejects.toMatchObject({ code: "23505" });
    expect((await as(db, bia, (tx) => tx.query("select id from public.video_reports where episode_id = $1", [episode]))).rows).toEqual([]);

    const resolved = await as(db, admin, (tx) =>
      tx.query("update public.video_reports set status = 'resolved', resolved_at = now() where episode_id = $1", [episode]),
    );
    const log = await db.query("select action, meta from public.audit_log where entity = 'video_reports' and actor_id = $1", [admin.id]);

    expect(resolved.affectedRows).toBe(1);
    expect(log.rows).toEqual([{ action: "update", meta: { changed: ["resolved_at", "status"] } }]);
  });
});

describe("conta apagada", () => {
  it("leva os dados do aluno junto e deixa a denúncia anônima", async () => {
    const db = await database();
    const carla = await createUser(db);
    await giveEverything(db, carla);
    const anonymousReports = async (): Promise<number> =>
      (await db.query<{ total: number }>("select count(*)::int as total from public.video_reports where user_id is null")).rows[0]?.total ?? -1;
    const before = await anonymousReports();

    await db.query("delete from auth.users where id = $1", [carla.id]);

    for (const table of STUDENT_TABLES.filter((t) => t !== "video_reports")) {
      const { rows } = await db.query(`select 1 from public.${table} where user_id = $1`, [carla.id]);
      expect(rows, table).toEqual([]);
    }
    expect(await db.query("select 1 from public.profiles where id = $1", [carla.id])).toMatchObject({ rows: [] });
    expect(await anonymousReports()).toBe(before + 1);
  });
});
