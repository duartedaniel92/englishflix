import { randomInt } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";

// Dados de teste criados como superusuário (fora do RLS). Todos os arquivos compartilham o banco,
// então cada teste cria o próprio nível, com código e posição que não colidem com os de outro teste.
let nextPosition = 1000;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const insert = async (db: PGlite, sql: string, params: unknown[]): Promise<string> => {
  const { rows } = await db.query<{ id: string }>(sql, params);
  const id = rows[0]?.id;
  if (!id) throw new Error(`insert sem id: ${sql}`);
  return id;
};

export function createLevel(db: PGlite): Promise<string> {
  const code = `T${Array.from({ length: 5 }, () => LETTERS[randomInt(LETTERS.length)]).join("")}`;
  return insert(db, "insert into public.levels (code, position) values ($1, $2) returning id", [code, nextPosition++]);
}

export async function createSeason(
  db: PGlite,
  options: { levelId?: string; status?: "draft" | "published" } = {},
): Promise<string> {
  const levelId = options.levelId ?? (await createLevel(db));
  return insert(db, "insert into public.seasons (level_id, position, title, status) values ($1, $2, 'Temporada de teste', $3) returning id", [
    levelId,
    nextPosition++,
    options.status ?? "published",
  ]);
}

export function createEpisode(
  db: PGlite,
  seasonId: string,
  options: { status?: "draft" | "published"; durationS?: number } = {},
): Promise<string> {
  return insert(
    db,
    `insert into public.episodes (season_id, position, title, youtube_video_id, channel_name, channel_url, duration_s, status)
     values ($1, $2, 'Episódio de teste', 'dQw4w9WgXcQ', 'Canal de teste', 'https://www.youtube.com/@canal', $3, $4) returning id`,
    [seasonId, nextPosition++, options.durationS ?? 600, options.status ?? "published"],
  );
}
