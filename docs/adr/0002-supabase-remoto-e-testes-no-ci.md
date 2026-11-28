# ADR 0002 — Supabase: projeto remoto de desenvolvimento e testes de banco no CI

Status: aceito. Data: 27/11/2026. Substitui o item "Supabase local via Docker" do [ADR 0001](0001-stack-e-hospedagem.md).

## Contexto

O ADR 0001 previa o Supabase local com Docker. A máquina de desenvolvimento tem 3,7 GB de RAM, um processador de 2 núcleos (Celeron N4020) e pouco disco livre. O Docker Desktop pede no mínimo 4 GB de RAM, e o Supabase local sobe cerca de 12 contêineres. Não cabe.

## Decisão

- O desenvolvimento usa um **projeto Supabase gratuito na nuvem, só para dev**, criado no início da Fase 1 (antes disso ele pausaria por inatividade sem uso). As chaves ficam no `.env.local`.
- Migrations, seeds e testes de RLS (pgTAP) rodam **no CI**: a cada PR, o GitHub Actions sobe o Supabase com Docker (`supabase start` e `supabase test db`). Só depois do CI verde as migrations vão para o projeto de dev (`supabase db push`).
- A CLI (`supabase`, em devDependencies) e o `supabase/config.jsonc` continuam versionados: eles definem o ambiente de banco do CI.

## Consequências

- Boa: a máquina de desenvolvimento fica leve, e o mesmo ambiente valida todo PR.
- Ruim: testar o banco depende de push (minutos, não segundos); o projeto de dev exige internet e pausa por inatividade no plano gratuito.
- Cuidado: nunca rodar teste destrutivo ou migration experimental direto no projeto de dev; o lugar de testar é o CI.
- Reversão: numa máquina com 8 GB de RAM ou mais, voltar ao `supabase start` local muda só o `.env.local`.
