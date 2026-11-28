-- Avaliação: questões do quiz e da prova, com os gabaritos em tabelas separadas.
-- O aluno lê as questões do quiz (sem resposta). O banco da prova e todos os gabaritos são só do admin:
-- na prova, o aluno recebe apenas as questões sorteadas, por função, e a correção acontece no servidor.

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  position integer not null check (position > 0),
  prompt text not null check (char_length(prompt) between 1 and 500),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_episode_position_key unique (episode_id, position) deferrable initially deferred
);

create table public.quiz_answer_keys (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.quiz_questions (id) on delete cascade,
  correct_option integer not null check (correct_option >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.exam_question_type as enum ('mcq', 'cloze', 'listening');

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete cascade,
  placement_level_id uuid references public.levels (id) on delete cascade,
  type public.exam_question_type not null,
  prompt text not null check (char_length(prompt) between 1 and 1000),
  options jsonb check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  media_video_id text check (media_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  media_start_s integer check (media_start_s >= 0),
  media_end_s integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Cada questão é de uma temporada (prova) ou de um nível (nivelamento), nunca dos dois.
  constraint exam_questions_scope check (num_nonnulls(season_id, placement_level_id) = 1),
  -- Múltipla escolha e listening têm opções; lacuna é resposta escrita.
  constraint exam_questions_options check ((type = 'cloze') = (options is null)),
  constraint exam_questions_listening_clip check (
    type <> 'listening' or (media_video_id is not null and media_start_s is not null and media_end_s > media_start_s)
  )
);
create index exam_questions_season_id_idx on public.exam_questions (season_id);
create index exam_questions_placement_level_id_idx on public.exam_questions (placement_level_id);

create table public.exam_answer_keys (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.exam_questions (id) on delete cascade,
  correct_option integer check (correct_option >= 0),
  accepted_answers text[] check (cardinality(accepted_answers) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_answer_keys_one_form check (num_nonnulls(correct_option, accepted_answers) = 1)
);

select private.protect_content_table(t)
  from unnest(array['public.quiz_questions', 'public.quiz_answer_keys', 'public.exam_questions', 'public.exam_answer_keys']::regclass[]) t;

create policy "logado lê questões de quiz de episódios visíveis" on public.quiz_questions
  for select to authenticated
  using (exists (select 1 from public.episodes e where e.id = episode_id));

-- Gabaritos e banco da prova: leitura só do admin (o aluno vê zero linhas).
create policy "admin lê gabaritos do quiz" on public.quiz_answer_keys
  for select to authenticated using ((select private.is_admin()));

create policy "admin lê o banco da prova" on public.exam_questions
  for select to authenticated using ((select private.is_admin()));

create policy "admin lê gabaritos da prova" on public.exam_answer_keys
  for select to authenticated using ((select private.is_admin()));
