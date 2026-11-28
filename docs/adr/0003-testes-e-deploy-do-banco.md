# ADR 0003 — Banco: testes com PGlite e deploy das migrations pelo CI

Status: aceito. Data: 27/11/2026. Substitui o item "testes de RLS com pgTAP no CI" do [ADR 0002](0002-supabase-remoto-e-testes-no-ci.md).

## Contexto

O ADR 0002 tirou o Docker da máquina de desenvolvimento e mandou os testes de banco (pgTAP) para o CI. Só que pgTAP exige Docker, e um ciclo de TDD que depende de push leva minutos por tentativa. Para RLS e funções SQL, que são o coração do projeto, isso é lento demais. O beauty-day já testava migrations e RLS nesta mesma máquina, sem Docker, com o PGlite.

## Decisão

- **Testes de banco em Vitest + PGlite** (Postgres 17 em WebAssembly, `supabase/tests/`). Um dublê fiel do Supabase recria os papéis (`anon`, `authenticated`, `service_role`), os privilégios padrão do schema `public` e `auth.uid()`/`auth.jwt()` com o mesmo corpo do Supabase. As migrations reais são aplicadas em ordem. Rodam no `npm test` local (a instância sobe em cerca de 15 s) e no job de qualidade do CI.
- **Guardas genéricos:** toda tabela do `public` com RLS, o visitante sem acesso a nenhuma tabela nem função. Provados contra uma violação de propósito.
- **Job `banco` no CI:** aplica as migrations no Postgres real do Supabase (`supabase db start` e `db reset`), roda `db lint --fail-on error` e `db advisors --fail-on error`. Pega o que o PGlite não reproduz.
- **Deploy pelo CI:** a cada merge na `main`, o job `deploy-banco` roda `supabase db push` e os advisors no projeto de desenvolvimento, usando o segredo `SUPABASE_DB_URL` (URI do session pooler, que é IPv4).
- Dados de referência (níveis, categorias, XP) ficam em migration, não em seed, para chegarem ao remoto pelo `db push`.

## Consequências

- Boa: TDD de banco em segundos, sem Docker; testes na mesma linguagem do resto; o Postgres real e os advisors validam cada PR; o remoto nunca fica para trás.
- Ruim: o dublê precisa acompanhar mudanças do Supabase (o job `banco` denuncia a divergência); o PGlite não tem pgTAP (não usamos); cada merge na `main` mexe no banco de desenvolvimento.
- Cuidado: o segredo `SUPABASE_DB_URL` contém a senha do banco. Fica só no GitHub, nunca no repositório nem no chat.
