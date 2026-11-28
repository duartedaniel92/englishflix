# TASKS — EnglishFlix

Status: Fase 0 concluída; Fase 1 em andamento. Atualização: 27/11/2026.

Esforço P/M/G não é prazo. Concluir só com evidência de aceite. Plano detalhado de cada fase é aprovado pelo autor antes de codar (prompt mestre §11.1).

## Fases

| Fase | Objetivo | Aceite | Status |
| --- | --- | --- | --- |
| 0 | Fundação: repositório, Next + TS estrito, Tailwind + shadcn, Supabase (CLI + config; [ADR 0002](adr/0002-supabase-remoto-e-testes-no-ci.md)), `CONSTRAINTS.md`, CI | CI verde no primeiro push e preview na Vercel | Concluída: merge do PR #1 em 27/11, produção em <https://englishflix-pearl.vercel.app> |
| 1 | Banco e RLS: esquema, RLS, dados de referência do B1, funções SQL, testes de banco, CI do banco e deploy das migrations (ADRs 0003 e 0004) | Testes de RLS passando no CI, advisors sem alerta crítico | Em andamento (PR 1a: esquema e RLS; PR 1b: funções) |
| 2 | Auth e conta: cadastro, login, recuperação, verificação, termos, Turnstile, rate limit | E2E do cadastro até a home | A fazer |
| 3 | Admin: níveis, categorias, temporadas, episódios (YouTube), questões, vocabulário | Publicar uma temporada completa só pelo painel | A fazer |
| 4 | Catálogo: home com fileiras, busca, detalhe, minha lista, populares, lançamentos | Todas as listas do material original funcionando | A fazer |
| 5 | Player e progresso: facade, posição salva, continuar assistindo | Retomar no mesmo ponto em outro dispositivo | A fazer |
| 6 | Tarefas: quiz, flashcards SM-2, shadowing, escrita | Episódio só conclui com as tarefas obrigatórias | A fazer |
| 7 | Provas e desbloqueio: nivelamento, prova, espera, liberação | Aluno não lê gabarito nem pula temporada (testado) | A fazer |
| 8 | Engajamento: streak, meta, XP, medalhas, certificado PDF | Certificado verificável por código | A fazer |
| 9 | Endurecimento e lançamento: segurança, a11y, Web Vitals, backups, privacidade | Go/no-go documentado | A fazer |

## Fase 0 — tarefas

| ID | Objetivo | Esforço | Depende de | Status | Aceite e validação |
| --- | --- | --- | --- | --- | --- |
| T0 | Repositório, branch da fase, `docs/`, `.gitattributes` | P | — | Concluída | Commits `88f8626`, `1361b26` |
| T1 | Esqueleto Next.js (TS estrito, scripts, Node fixado, placeholder PT-BR) | M | T0 | Concluída | 27/11: `lint`, `typecheck` e `build` limpos; piso do ESLint testado com violações de propósito |
| T2 | Documentação (6 docs, `CONSTRAINTS.md`, ADR 0001, README, AGENTS/CLAUDE) | M | T0 | Concluída | Aprovada pelo autor com o merge do PR #1 |
| T3 | shadcn/ui + tema escuro | P | T1 | Concluída | 27/11: `check`, build e E2E verdes; no navegador, fundo escuro, texto claro e fonte Geist aplicada em 360 px |
| T4 | Vitest (`lib/env.ts`) + Playwright (fumaça em 360 px) | M | T1 | Concluída | 27/11: 8 testes unitários; E2E em 360 px contra o build; build falha com segredo em `NEXT_PUBLIC_*` (ambiente e `.env.local`) e passa sem ele |
| T5 | Supabase: CLI e config versionados | P | T1 | Concluída (escopo mudou) | 27/11: CLI 3.4.0 e `supabase/config.jsonc` versionados. O Docker local não cabe nesta máquina (3,7 GB de RAM); o banco de dev vira projeto remoto e os testes de banco vão para o CI ([ADR 0002](adr/0002-supabase-remoto-e-testes-no-ci.md)), ambos na Fase 1 |
| T6 | CI (quality + secrets), Dependabot, pre-commit com gitleaks | M | T4 | Concluída | 27/11: histórico limpo no gitleaks 8.30.1; o hook bloqueia token falso (`github-pat`, valor `REDACTED`) e deixa passar commit limpo; CI verde no primeiro push (quality 1m09s, secrets 6s, todos os passos executados) |
| T7 | Repositório público no GitHub, PR, preview na Vercel | P | T6 + ok do autor | Concluída | 27/11: [repositório](https://github.com/duartedaniel92/englishflix) público e [PR #1](https://github.com/duartedaniel92/englishflix/pull/1) com 4 checks verdes (qualidade, segredos, Vercel, comentários de preview). O projeto na Vercel foi importado pelo autor (o conector recebeu 403 ao criar); o preview da branch ficou pronto em 25 s e responde 200 com `lang="pt-BR"` e tema escuro |

## Bloqueios

| Bloqueio | Quem resolve | Próximo passo |
| --- | --- | --- |
| Disco C: com 2,1 GB livres (risco para install, build e Playwright) | Autor | O Docker Desktop não é mais usado (ADR 0002) e ocupa 3,9 GB: desinstalar libera espaço |

## Evidências e histórico

- 27/11/2026: plano da Fase 0 aprovado.
- 27/11/2026: aceite da Fase 0 cumprido. CI verde no primeiro push do [PR #1](https://github.com/duartedaniel92/englishflix/pull/1) e preview da Vercel respondendo 200. Falta a revisão do autor e o merge (com merge commit, para preservar o histórico).
- 27/11/2026: Fase 0 concluída. [PR #1](https://github.com/duartedaniel92/englishflix/pull/1) mesclado (`8a1bb06`); produção pública em <https://englishflix-pearl.vercel.app> (200 sem login). Primeiro PR do Dependabot ([#2](https://github.com/duartedaniel92/englishflix/pull/2), correções de react e tailwind) mesclado com CI verde.
- 27/11/2026: plano da Fase 1 aprovado (região São Paulo, só a estrutura do B1, revisão da prova sem a resposta certa, deploy das migrations pelo CI).
