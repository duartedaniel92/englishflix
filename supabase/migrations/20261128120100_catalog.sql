-- Catálogo: níveis, categorias, temporadas, episódios e vocabulário.
-- O aluno logado lê só o que está publicado; só o admin escreve, e cada escrita dele vai para o audit_log.

create type public.publication_status as enum ('draft', 'published');

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9+]{0,5}$'),
  position integer not null unique check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_current_level_id_fkey
  foreign key (current_level_id) references public.levels (id) on delete set null;
create index profiles_current_level_id_idx on public.profiles (current_level_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels (id) on delete restrict,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  cover_url text check (cover_url ~ '^https://'),
  status public.publication_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  exam_pass_score integer not null default 70 check (exam_pass_score between 1 and 100),
  exam_question_count integer not null default 20 check (exam_question_count between 1 and 100),
  exam_time_limit_minutes integer not null default 30 check (exam_time_limit_minutes between 5 and 180),
  retake_cooldown_hours integer not null default 24 check (retake_cooldown_hours between 0 and 720),
  -- Um episódio conta como concluído com min_watched_pct do vídeo assistido (e o quiz feito);
  -- a prova libera com exam_eligibility_pct dos episódios concluídos.
  min_watched_pct integer not null default 90 check (min_watched_pct between 1 and 100),
  exam_eligibility_pct integer not null default 80 check (exam_eligibility_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Reordenar troca posições dentro da mesma transação: a unicidade só é checada no commit.
  constraint seasons_level_position_key unique (level_id, position) deferrable initially deferred,
  constraint seasons_published_has_date check (status = 'draft' or published_at is not null)
);

create function private.set_published_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end
$$;

create trigger set_published_at before insert or update of status on public.seasons
  for each row execute function private.set_published_at();

create table public.season_categories (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, category_id)
);
create index season_categories_category_id_idx on public.season_categories (category_id);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 160),
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  channel_name text not null check (char_length(channel_name) between 1 and 120),
  channel_url text not null check (channel_url ~ '^https://(www\.)?youtube\.com/'),
  duration_s integer not null check (duration_s > 0),
  thumbnail_url text check (thumbnail_url ~ '^https://'),
  -- Trecho opcional do vídeo: o episódio pode começar e terminar fora das pontas.
  start_s integer check (start_s >= 0),
  end_s integer check (end_s > 0),
  status public.publication_status not null default 'draft',
  embeddable_checked_at timestamptz,
  is_broken boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint episodes_season_position_key unique (season_id, position) deferrable initially deferred,
  constraint episodes_clip_window check (end_s is null or (end_s > coalesce(start_s, 0) and end_s <= duration_s))
);

create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  term text not null check (char_length(term) between 1 and 80),
  definition_pt text not null check (char_length(definition_pt) between 1 and 300),
  example text not null default '' check (char_length(example) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, term)
);

-- audit_log: só o gatilho escreve; o admin lê; ninguém altera nem apaga.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audit_log_actor_id_idx on public.audit_log (actor_id);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
create policy "admin lê o audit_log" on public.audit_log
  for select to authenticated
  using ((select private.is_admin()));

-- SECURITY DEFINER: o admin não tem permissão de escrever no audit_log; só este gatilho tem.
-- Registra quais colunas mudaram, nunca os valores (gabaritos também passam por aqui).
create function private.audit_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  -- Só ações de quem está logado; migrations e jobs do servidor não têm usuário.
  if actor is not null then
    insert into public.audit_log (actor_id, action, entity, entity_id, meta)
    values (
      actor,
      lower(tg_op),
      tg_table_name,
      case tg_op when 'DELETE' then old.id else new.id end,
      case tg_op
        when 'UPDATE' then jsonb_build_object('changed', (
          select coalesce(jsonb_agg(n.key order by n.key), '[]'::jsonb)
            from jsonb_each(to_jsonb(new)) n
           where n.key <> 'updated_at' and to_jsonb(old) -> n.key is distinct from n.value
        ))
        else '{}'::jsonb
      end
    );
  end if;
  return null;
end
$$;

-- Regras de toda tabela de conteúdo: updated_at automático, auditoria, RLS e escrita só do admin.
-- Usada só pelas migrations: ninguém recebe permissão de executá-la.
create function private.protect_content_table(t regclass) returns void
language plpgsql set search_path = ''
as $$
begin
  execute format('create trigger set_updated_at before update on %s for each row execute function extensions.moddatetime(updated_at)', t);
  execute format('create trigger audit_change after insert or update or delete on %s for each row execute function private.audit_change()', t);
  execute format('alter table %s enable row level security', t);
  execute format('grant select, insert, update, delete on %s to authenticated', t);
  execute format('create policy "admin cria" on %s for insert to authenticated with check ((select private.is_admin()))', t);
  execute format('create policy "admin altera" on %s for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  execute format('create policy "admin apaga" on %s for delete to authenticated using ((select private.is_admin()))', t);
end
$$;

select private.protect_content_table(t)
  from unnest(array['public.levels', 'public.categories', 'public.seasons', 'public.season_categories', 'public.episodes', 'public.vocabulary']::regclass[]) t;

create trigger set_updated_at before update on public.audit_log
  for each row execute function extensions.moddatetime(updated_at);

-- Leitura: o filho é visível quando o pai é (a subconsulta também passa pelo RLS de quem consulta).
create policy "logado lê os níveis" on public.levels
  for select to authenticated using (true);

create policy "logado lê as categorias" on public.categories
  for select to authenticated using (true);

create policy "logado lê temporadas publicadas" on public.seasons
  for select to authenticated
  using (status = 'published' or (select private.is_admin()));

create policy "logado lê categorias de temporadas visíveis" on public.season_categories
  for select to authenticated
  using (exists (select 1 from public.seasons s where s.id = season_id));

create policy "logado lê episódios publicados" on public.episodes
  for select to authenticated
  using (
    (status = 'published' and exists (select 1 from public.seasons s where s.id = season_id))
    or (select private.is_admin())
  );

create policy "logado lê vocabulário de episódios visíveis" on public.vocabulary
  for select to authenticated
  using (exists (select 1 from public.episodes e where e.id = episode_id));
