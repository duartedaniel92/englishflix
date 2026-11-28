import { describe, expect, it } from "vitest";
import { createEpisode, createLevel, createSeason } from "./fixtures";
import { as, createUser, database } from "./harness";

describe("catálogo para o aluno", () => {
  it("mostra só temporadas e episódios publicados", async () => {
    const db = await database();
    const student = await createUser(db);
    const level = await createLevel(db);
    const published = await createSeason(db, { levelId: level });
    const draft = await createSeason(db, { levelId: level, status: "draft" });
    const episode = await createEpisode(db, published);
    await createEpisode(db, published, { status: "draft" });
    await createEpisode(db, draft);

    const seasons = await as(db, student, (tx) => tx.query("select id from public.seasons where level_id = $1", [level]));
    const episodes = await as(db, student, (tx) =>
      tx.query("select id from public.episodes where season_id in ($1, $2)", [published, draft]),
    );

    expect(seasons.rows).toEqual([{ id: published }]);
    expect(episodes.rows).toEqual([{ id: episode }]);
  });

  it("esconde vocabulário e categorias de conteúdo não publicado", async () => {
    const db = await database();
    const student = await createUser(db);
    const season = await createSeason(db);
    const draft = await createSeason(db, { status: "draft" });
    const visible = await createEpisode(db, season);
    const hidden = await createEpisode(db, season, { status: "draft" });
    const { rows } = await db.query<{ id: string }>(
      "insert into public.categories (name, slug) values ('Teste', $1) returning id",
      [`teste-${visible.slice(0, 8)}`],
    );
    const category = rows[0]?.id;
    await db.query("insert into public.season_categories (season_id, category_id) values ($1, $3), ($2, $3)", [season, draft, category]);
    await db.query(
      "insert into public.vocabulary (episode_id, term, definition_pt) values ($1, 'pick up', 'buscar'), ($2, 'hold on', 'espere')",
      [visible, hidden],
    );

    const vocabulary = await as(db, student, (tx) =>
      tx.query("select term from public.vocabulary where episode_id in ($1, $2)", [visible, hidden]),
    );
    const links = await as(db, student, (tx) =>
      tx.query("select season_id from public.season_categories where category_id = $1", [category]),
    );

    expect(vocabulary.rows).toEqual([{ term: "pick up" }]);
    expect(links.rows).toEqual([{ season_id: season }]);
  });

  it("não deixa o aluno criar, alterar ou apagar o catálogo", async () => {
    const db = await database();
    const student = await createUser(db);
    const season = await createSeason(db);
    const episode = await createEpisode(db, season);

    await expect(
      as(db, student, (tx) => tx.query("insert into public.categories (name, slug) values ('Hack', 'hack')")),
    ).rejects.toMatchObject({ code: "42501" });
    const updated = await as(db, student, (tx) => tx.query("update public.seasons set title = 'hack' where id = $1", [season]));
    const deleted = await as(db, student, (tx) => tx.query("delete from public.episodes where id = $1", [episode]));

    expect(updated.affectedRows).toBe(0);
    expect(deleted.affectedRows).toBe(0);
    const { rows } = await db.query("select title from public.seasons where id = $1", [season]);
    expect(rows).toEqual([{ title: "Temporada de teste" }]);
  });
});

describe("catálogo para o admin", () => {
  it("o admin escreve, e cada mudança fica no audit_log com o autor", async () => {
    const db = await database();
    const admin = await createUser(db, { admin: true });
    const student = await createUser(db);

    const created = await as(db, admin, (tx) =>
      tx.query<{ id: string }>("insert into public.categories (name, slug) values ('Viagem', $1) returning id", [
        `viagem-${admin.id.slice(0, 8)}`,
      ]),
    );
    const id = created.rows[0]?.id;
    await as(db, admin, (tx) => tx.query("update public.categories set name = 'Viagens', featured = true where id = $1", [id]));

    const log = await as(db, admin, (tx) =>
      tx.query("select actor_id, action, entity, meta from public.audit_log where entity_id = $1 order by created_at, action", [id]),
    );
    expect(log.rows).toEqual([
      { actor_id: admin.id, action: "insert", entity: "categories", meta: {} },
      { actor_id: admin.id, action: "update", entity: "categories", meta: { changed: ["featured", "name"] } },
    ]);

    const studentView = await as(db, student, (tx) => tx.query("select id from public.audit_log where entity_id = $1", [id]));
    expect(studentView.rows).toEqual([]);
  });

  it("barra um 'admin' que só existe no user_metadata", async () => {
    const db = await database();
    const fake = await createUser(db, { userMetadata: { role: "admin" } });

    await expect(
      as(db, fake, (tx) => tx.query("insert into public.categories (name, slug) values ('Falso', 'falso-admin')")),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("publicar uma temporada preenche a data de publicação", async () => {
    const db = await database();
    const admin = await createUser(db, { admin: true });
    const season = await createSeason(db, { status: "draft" });

    const before = await db.query("select published_at from public.seasons where id = $1", [season]);
    await as(db, admin, (tx) => tx.query("update public.seasons set status = 'published' where id = $1", [season]));
    const after = await db.query<{ published_at: Date | null }>("select published_at from public.seasons where id = $1", [season]);

    expect(before.rows).toEqual([{ published_at: null }]);
    expect(after.rows[0]?.published_at).toBeInstanceOf(Date);
  });
});
