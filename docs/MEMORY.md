# MEMORY — EnglishFlix

Atualização: 27/11/2026. Status: Fase 0 (fundação) em andamento.

## Estado atual

- Branch `chore/fase-0-fundacao`. T0 e T1 (esqueleto Next 16.4.6) concluídas; T2 (docs) em revisão. Ver [TASKS.md](TASKS.md).
- Nada publicado ainda (sem repositório remoto, sem Vercel).

## Decisões

| Data | Decisão | Motivo | Impacto | Fonte |
| --- | --- | --- | --- | --- |
| 27/11/2026 | Escopo, stack e regras do prompt mestre | Decisões fechadas pelo autor | Tudo | [PROMPT_MESTRE.md](PROMPT_MESTRE.md) |
| 27/11/2026 | Supabase local com Docker Desktop | Migrations e testes de RLS iguais na máquina e no CI | Autor instala Docker | [ADR 0001](adr/0001-stack-e-hospedagem.md) |
| 27/11/2026 | Commits livres na branch da fase; push, repositório e deploy só com ok | O prompt pede commits atômicos; a regra comum pede autorização | Exceção em [RULES.md](RULES.md) | Autor |
| 27/11/2026 | Repositório público no GitHub | Portfólio; Actions ilimitado em repositório público | gitleaks obrigatório | Autor |
| 27/11/2026 | `cacheComponents` desligado | CSP com nonce exige renderização na hora, o que anula a casca estática | Modelo clássico; cache com `revalidate` | [ADR 0001](adr/0001-stack-e-hospedagem.md) |
| 27/11/2026 | ESLint fica no 9 (o npm avisa que não tem mais suporte) | `eslint-plugin-react` 7.37.5, `eslint-plugin-jsx-a11y` 6.10.2 e `eslint-plugin-import` 2.32.0 (últimas versões, usadas pelo `eslint-config-next` 16.4.6) só aceitam até o ESLint 9 | Ferramenta só de desenvolvimento; `npm audit` limpo em 27/11. Reavaliar quando o Dependabot trouxer suporte ao 10 | npm registry, 27/11/2026 |
| 27/11/2026 | Sentry fora do MVP | Decisão fechada no prompt | Exceção à definição de pronto | [RULES.md](RULES.md) |
| 27/11/2026 | Capturas da `estrutura-sugerida/` fora do Git | Material de terceiros | Mapeamento no PRD | [PRD.md](PRD.md) |

## Preferências confirmadas

- Português, linguagem simples, explicar o porquê em 1–2 frases e nomear os padrões usados.
- Uma fase por vez, com plano curto aprovado antes de codar.

## Pendências e retomada

- Próximo passo: terminar a T1 (instalar dependências, desligar `cacheComponents`, ajustes) e a T2; depois T3 → T7.
- Autor: instalar Docker Desktop e gitleaks (ver bloqueios em [TASKS.md](TASKS.md)).
- Abrir na Fase 2: ADR de CSP (nonce) e direção visual (`impeccable`).

## Skills: nomes do prompt → nomes reais

| No prompt mestre | Skill instalada |
| --- | --- |
| `agent-skills:spec` | `agent-skills:spec-driven-development` |
| `agent-skills:plan` | `agent-skills:planning-and-task-breakdown` |
| `agent-skills:constraints` | `agent-skills:constraint-driven-development` |
| `agent-skills:build` | `agent-skills:incremental-implementation` |
| `agent-skills:test` | `agent-skills:test-driven-development` |
| `agent-skills:review` | `agent-skills:code-review-and-quality` |
| `agent-skills:ship` | `agent-skills:shipping-and-launch` |
| `agent-skills:webperf` | `agent-skills:performance-optimization` + agente `web-performance-auditor` |
| `impeccable` | `impeccable:impeccable` |
| `vercel-react-best-practices`, `web-design-guidelines`, `webapp-testing` | prefixo `anthropic-skills:` |

## Tentativas e lições

- 27/11/2026: `npx` e `npm install` lentos nesta máquina. Dois processos npm ao mesmo tempo (download do Ruflo + `create-next-app`) travaram; a sessão caiu com o scaffold sem `node_modules`. Lição: rodar um processo npm por vez, em segundo plano.
- 27/11/2026: o primeiro `npm install` (358 pacotes) levou 31 minutos. Juntar dependências num único install.
- 27/11/2026: o `create-next-app` 16.4.6 com `--yes` liga `cacheComponents` e `partialPrefetching` por padrão e usa `@tailwindcss/turbopack` em vez de PostCSS.
- 27/11/2026: a doc instalada (`content-security-policy.md`) confirma que nonce exige renderização dinâmica e que PPR é incompatível com CSP de nonce; cita SRI (experimental) como alternativa que mantém páginas estáticas, a avaliar no ADR da Fase 2. A doc chama o modelo sem Cache Components de "Previous Model": suportado, mas não é a direção do framework. `partialPrefetching` só funciona com `cacheComponents`.
- 27/11/2026: Vitest 5.1.2 no Windows não roda nenhum teste se o terminal abrir em `c:` minúsculo (o VS Code abre assim): o caminho vira `c:` de um lado e `C:` do outro, e o Vitest se carrega duas vezes ("failed to find the current suite"). `resolve.preserveSymlinks` **não** resolveu. Solução: `npm test` chama `scripts/vitest.mjs`, que roda o Vitest a partir de `realpathSync.native` (caminho canônico). Usar `npm test`, não `npx vitest`, nesses terminais.
- 27/11/2026: revisão (ponytail-review) das mudanças da T4/T6: a trava de segredo passou do runtime para o build; regra de teste pulado ampliada (`skipIf`, `runIf`, `fail`, `fails`); scripts faltantes adicionados; linhas redundantes removidas.
- Ruflo: pacote oficial `ruflo` (ruvnet), 3.80.11. Ainda não rodou neste projeto.

## Cuidados

Nunca guardar credenciais, tokens ou dados pessoais. Marcar decisões substituídas. Não transformar resultados antigos de testes em garantias atuais.
