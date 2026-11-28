-- Base de segurança: extensões, schema privado, privilégios padrão, papel de admin e perfil do aluno.

create schema if not exists extensions;
create extension if not exists moddatetime with schema extensions;

-- Funções internas e gatilhos ficam fora da API: o PostgREST só expõe o schema public.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Nada nasce acessível: cada tabela e cada função recebe grant explícito quando for criada.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Admin vem só do app_metadata, que o usuário não consegue editar (o user_metadata ele consegue).
create function private.is_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
$$;
grant execute on function private.is_admin() to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  current_level_id uuid,
  placement_done boolean not null default false,
  xp integer not null default 0 check (xp >= 0),
  streak_current integer not null default 0 check (streak_current >= 0),
  streak_best integer not null default 0 check (streak_best >= 0),
  last_activity_date date,
  weekly_goal_minutes integer not null default 60 check (weekly_goal_minutes between 10 and 1200),
  consented_at timestamptz,
  terms_version text check (char_length(terms_version) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

alter table public.profiles enable row level security;
-- XP, streak e nivelamento só mudam por funções do servidor; o aluno edita nome e meta semanal.
grant select, update (display_name, weekly_goal_minutes) on public.profiles to authenticated;

create policy "aluno lê o próprio perfil" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "aluno edita o próprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- SECURITY DEFINER: o gatilho roda no cadastro, antes de existir sessão do aluno.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  terms text := left(new.raw_user_meta_data ->> 'terms_version', 20);
begin
  insert into public.profiles (id, display_name, terms_version, consented_at)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60),
    terms,
    case when terms is not null then now() end
  );
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
