# TASKS — EnglishFlix

Status: Fase 0 em andamento. Atualização: 27/11/2026.

Esforço P/M/G não é prazo. Concluir só com evidência de aceite. Plano detalhado de cada fase é aprovado pelo autor antes de codar (prompt mestre §11.1).

## Fases

| Fase | Objetivo | Aceite | Status |
| --- | --- | --- | --- |
| 0 | Fundação: repositório, Next + TS estrito, Tailwind + shadcn, Supabase local, `CONSTRAINTS.md`, CI | CI verde no primeiro push e preview na Vercel | Em andamento |
| 1 | Banco e RLS: migrations, seeds B1, funções SQL, testes de RLS | Testes de RLS passando, advisors sem alerta crítico | A fazer |
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
| T2 | Documentação (6 docs, `CONSTRAINTS.md`, ADR 0001, README, AGENTS/CLAUDE) | M | T0 | Em revisão | Aguarda leitura do autor |
| T3 | shadcn/ui + tema escuro | P | T1 | Concluída | 27/11: `check`, build e E2E verdes; no navegador, fundo escuro, texto claro e fonte Geist aplicada em 360 px |
| T4 | Vitest (`lib/env.ts`) + Playwright (fumaça em 360 px) | M | T1 | Concluída | 27/11: 8 testes unitários; E2E em 360 px contra o build; build falha com segredo em `NEXT_PUBLIC_*` (ambiente e `.env.local`) e passa sem ele |
| T5 | Supabase local (CLI como devDependency) | P | T1 + Docker instalado | Bloqueada | 27/11: `supabase init` feito (CLI 3.4.0, `supabase/config.jsonc`). Falta `supabase start` e `status`, que esperam o Docker |
| T6 | CI (quality + secrets), Dependabot, pre-commit com gitleaks | M | T4 | Concluída | 27/11: histórico limpo no gitleaks 8.30.1; o hook bloqueia token falso (`github-pat`, valor `REDACTED`) e deixa passar commit limpo; CI verde no primeiro push (quality 1m09s, secrets 6s, todos os passos executados) |
| T7 | Repositório público no GitHub, PR, preview na Vercel | P | T6 + ok do autor | Em andamento | 27/11: [repositório](https://github.com/duartedaniel92/englishflix) público e [PR #1](https://github.com/duartedaniel92/englishflix/pull/1) com CI verde. Vercel: o conector recebeu 403 ao criar o projeto; o autor importa pelo painel, depois um push na branch gera o preview |

## Bloqueios

| Bloqueio | Quem resolve | Próximo passo |
| --- | --- | --- |
| Docker Desktop 4.100.1 instalado, mas o motor não está rodando (bloqueia T5) | Autor | Abrir o Docker Desktop uma vez e aceitar os termos |
| Projeto na Vercel não criado: o conector da Vercel recebeu 403 (sem permissão para criar projeto) | Autor | Importar `duartedaniel92/englishflix` em vercel.com/new; o primeiro deploy (da `main`, ainda vazia) falha, e isso é esperado |

## Evidências e histórico

- 27/11/2026: plano da Fase 0 aprovado.
