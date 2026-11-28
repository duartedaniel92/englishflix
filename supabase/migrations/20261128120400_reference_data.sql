-- Dados de referência que todo ambiente precisa: local, CI e o projeto remoto (via db push).
-- Por isso ficam numa migration, e não no seed.sql. Temporadas e conteúdo entram pelo painel do admin.

insert into public.levels (code, position) values ('B1', 1), ('B2', 2), ('C1', 3), ('C2', 4);

insert into public.categories (name, slug) values
  ('Daily Life', 'daily-life'),
  ('Business', 'business'),
  ('Travel', 'travel');

-- XP por ação, ajustável pelo admin (o prompt pede os valores na tabela, não no código).
insert into public.xp_config (kind, amount) values
  ('episode', 10),
  ('quiz', 5),
  ('review', 1),
  ('exam', 20),
  ('season', 100);
