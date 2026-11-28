-- Dados do aluno: estado das temporadas, progresso, flashcards, lista, provas, XP, medalhas,
-- certificados e denúncias. O aluno lê só o que é dele. Escreve direto só o que não dá vantagem
-- (lista, denúncia, tarefas livres, rascunho da prova); estado de temporada, nota, XP, conclusão
-- e medalha só mudam pelas funções do servidor. Onde o aluno insere, o dono vem da sessão.

create type public.season_state as enum ('locked', 'unlocked', 'completed');
create type public.unlock_source as enum ('exam', 'placement', 'start');
create type public.exam_kind as enum ('season', 'placement');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- Sem linha para a temporada = bloqueada.
create table public.user_season_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  state public.season_state not null,
  source public.unlock_source not null,
  unlocked_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, season_id),
  constraint user_season_state_completed_has_date check ((state = 'completed') = (completed_at is not null))
);
create index user_season_state_season_id_idx on public.user_season_state (season_id);

create table public.episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  episode_id uuid not null references public.episodes (id) on delete cascade,
  position_s integer not null default 0 check (position_s >= 0),
  watched_pct numeric(5, 2) not null default 0 check (watched_pct between 0 and 100),
  completed_at timestamptz,
  quiz_score integer check (quiz_score between 0 and 100),
  shadowing_done boolean not null default false,
  writing_text text not null default '' check (char_length(writing_text) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);
create index episode_progress_episode_id_idx on public.episode_progress (episode_id);

-- repetitions é o contador do SM-2 (quantas revisões certas seguidas).
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary (id) on delete cascade,
  ease numeric(4, 2) not null default 2.5 check (ease >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vocabulary_id)
);
create index flashcard_reviews_vocabulary_id_idx on public.flashcard_reviews (vocabulary_id);

create table public.my_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, season_id)
);
create index my_list_season_id_idx on public.my_list (season_id);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.exam_kind not null default 'season',
  season_id uuid references public.seasons (id) on delete cascade,
  question_ids uuid[] not null check (cardinality(question_ids) between 1 and 100),
  answers jsonb not null default '{}' check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 20000),
  -- Depois da correção: [{question_id, correct}], sem a resposta certa.
  results jsonb check (jsonb_typeof(results) = 'array'),
  score integer check (score between 0 and 100),
  passed boolean,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_attempts_scope check ((kind = 'season') = (season_id is not null)),
  constraint exam_attempts_graded check ((submitted_at is null) = (score is null) and (submitted_at is null) = (passed is null)),
  constraint exam_attempts_window check (expires_at > started_at)
);
-- Uma tentativa aberta por aluno, garantida pelo banco: duas abas ao mesmo tempo não criam duas.
create unique index exam_attempts_one_open_per_user on public.exam_attempts (user_id) where submitted_at is null;
create index exam_attempts_user_season_idx on public.exam_attempts (user_id, season_id, submitted_at desc);
create index exam_attempts_season_id_idx on public.exam_attempts (season_id);

create table public.xp_config (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('episode', 'quiz', 'review', 'exam', 'season')),
  amount integer not null check (amount between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null references public.xp_config (kind) on update cascade,
  amount integer not null check (amount >= 0),
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A mesma ação (episódio, quiz, prova, temporada) não rende XP duas vezes.
  unique (user_id, kind, ref_id)
);
create index xp_events_kind_idx on public.xp_events (kind);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{1,60}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  season_id uuid unique references public.seasons (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
create index user_badges_badge_id_idx on public.user_badges (badge_id);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  level_id uuid not null references public.levels (id) on delete restrict,
  code text not null unique check (code ~ '^[A-Z0-9]{12}$'),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, level_id)
);
create index certificates_level_id_idx on public.certificates (level_id);

-- Conta apagada não apaga a denúncia: ela fica anônima para o admin ainda tratar o vídeo.
create table public.video_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references public.profiles (id) on delete set null,
  episode_id uuid not null references public.episodes (id) on delete cascade,
  reason text not null check (reason in ('broken', 'private', 'removed', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status public.report_status not null default 'open',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_reports_resolved_has_date check ((status = 'open') = (resolved_at is null))
);
-- Uma denúncia aberta por aluno e episódio.
create unique index video_reports_one_open on public.video_reports (user_id, episode_id) where status = 'open';
create index video_reports_user_id_idx on public.video_reports (user_id);
create index video_reports_episode_id_idx on public.video_reports (episode_id);

-- Tabelas de configuração: todo aluno lê; só o admin escreve.
select private.protect_content_table(t) from unnest(array['public.xp_config', 'public.badges']::regclass[]) t;
create policy "logado lê a tabela de XP" on public.xp_config for select to authenticated using (true);
create policy "logado lê as medalhas" on public.badges for select to authenticated using (true);

-- Tabelas do aluno: updated_at automático, RLS e leitura só do que é dele.
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_season_state', 'episode_progress', 'flashcard_reviews', 'my_list', 'exam_attempts',
    'xp_events', 'user_badges', 'certificates'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function extensions.moddatetime(updated_at)', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy "aluno lê o que é dele" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end
$$;

-- O aluno estuda o episódio se ele está publicado e a temporada está liberada para ele.
-- Confere status e dono explicitamente, sem depender do RLS: serve também às funções SECURITY DEFINER.
create function private.can_study(p_episode_id uuid) returns boolean
language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1
      from public.episodes e
      join public.seasons se on se.id = e.season_id
      join public.user_season_state s on s.season_id = e.season_id
     where e.id = p_episode_id
       and e.status = 'published'
       and se.status = 'published'
       and s.user_id = (select auth.uid())
       and s.state in ('unlocked', 'completed')
  )
$$;
grant execute on function private.can_study(uuid) to authenticated;

-- Tarefas livres do episódio: o aluno marca o shadowing e escreve; progresso e quiz vêm de funções.
grant insert (episode_id, shadowing_done, writing_text), update (shadowing_done, writing_text) on public.episode_progress to authenticated;
create policy "aluno registra tarefas livres" on public.episode_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_study(episode_id));
create policy "aluno atualiza tarefas livres" on public.episode_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.can_study(episode_id));

grant insert (season_id), delete on public.my_list to authenticated;
create policy "aluno adiciona temporada visível" on public.my_list
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.seasons s where s.id = season_id));
create policy "aluno remove da própria lista" on public.my_list
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Rascunho da prova: só a coluna answers, da tentativa aberta e dentro do prazo.
grant update (answers) on public.exam_attempts to authenticated;
create policy "aluno salva o rascunho da tentativa aberta" on public.exam_attempts
  for update to authenticated
  using (user_id = (select auth.uid()) and submitted_at is null and expires_at > now())
  with check (user_id = (select auth.uid()) and submitted_at is null and expires_at > now());

-- Denúncias: o aluno cria e vê as dele; o admin vê todas e trata, com auditoria.
create trigger set_updated_at before update on public.video_reports
  for each row execute function extensions.moddatetime(updated_at);
create trigger audit_change after update on public.video_reports
  for each row execute function private.audit_change();
alter table public.video_reports enable row level security;
grant select, insert (episode_id, reason, details), update (status, resolved_at) on public.video_reports to authenticated;
create policy "aluno vê as próprias denúncias e o admin vê todas" on public.video_reports
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "aluno denuncia episódio visível" on public.video_reports
  for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.episodes e where e.id = episode_id));
create policy "admin trata denúncias" on public.video_reports
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
