# MEMORY — EnglishFlix

Atualização: 27/11/2026. Status: Fase 0 (fundação) em andamento.

## Estado atual

- **Fase 0 concluída** em 27/11: [PR #1](https://github.com/duartedaniel92/englishflix/pull/1) mesclado na `main`; produção pública em <https://englishflix-pearl.vercel.app>.
- **Fase 1 em andamento**, branch `feat/fase-1a-esquema-rls` (PR 1a: esquema, RLS, harness de testes e CI do banco). Depois vem a PR 1b (funções). Ver [TASKS.md](TASKS.md).

## Decisões

| Data | Decisão | Motivo | Impacto | Fonte |
| --- | --- | --- | --- | --- |
| 27/11/2026 | Escopo, stack e regras do prompt mestre | Decisões fechadas pelo autor | Tudo | [PROMPT_MESTRE.md](PROMPT_MESTRE.md) |
| 27/11/2026 | ~~Supabase local com Docker Desktop~~ (substituída no mesmo dia pela linha abaixo) | Migrations e testes de RLS iguais na máquina e no CI | — | [ADR 0001](adr/0001-stack-e-hospedagem.md) |
| 27/11/2026 | Supabase: projeto remoto de dev + testes de banco no CI | A máquina tem 3,7 GB de RAM, 2 núcleos e pouco disco; Docker + Supabase local não cabem | Sem Docker local; projeto de dev e job de banco no CI na Fase 1 | [ADR 0002](adr/0002-supabase-remoto-e-testes-no-ci.md) |
| 27/11/2026 | Commits livres na branch da fase; push, repositório e deploy só com ok | O prompt pede commits atômicos; a regra comum pede autorização | Exceção em [RULES.md](RULES.md) | Autor |
| 27/11/2026 | Repositório público no GitHub | Portfólio; Actions ilimitado em repositório público | gitleaks obrigatório | Autor |
| 27/11/2026 | `cacheComponents` desligado | CSP com nonce exige renderização na hora, o que anula a casca estática | Modelo clássico; cache com `revalidate` | [ADR 0001](adr/0001-stack-e-hospedagem.md) |
| 27/11/2026 | ESLint fica no 9 (o npm avisa que não tem mais suporte) | `eslint-plugin-react` 7.37.5, `eslint-plugin-jsx-a11y` 6.10.2 e `eslint-plugin-import` 2.32.0 (últimas versões, usadas pelo `eslint-config-next` 16.4.6) só aceitam até o ESLint 9 | Ferramenta só de desenvolvimento; `npm audit` limpo em 27/11. Reavaliar quando o Dependabot trouxer suporte ao 10 | npm registry, 27/11/2026 |
| 27/11/2026 | shadcn/ui com o preset padrão do CLI 4 (`base-nova`: Base UI, cor neutra) | Nada depende da escolha ainda; o visual será redesenhado na direção da Fase 2 | Componentes entram com `npx shadcn add <nome>` quando forem usados, e o CLI instala as dependências de cada um (o botão gerado no init foi removido) | `components.json` |
| 27/11/2026 | Sentry fora do MVP | Decisão fechada no prompt | Exceção à definição de pronto | [RULES.md](RULES.md) |
| 27/11/2026 | Capturas da `estrutura-sugerida/` fora do Git | Material de terceiros | Mapeamento no PRD | [PRD.md](PRD.md) |

## Preferências confirmadas

- Português, linguagem simples, explicar o porquê em 1–2 frases e nomear os padrões usados.
- Uma fase por vez, com plano curto aprovado antes de codar.

## Pendências e retomada

- 27/11: o `winget install` falhou com `0x80080008` porque o serviço AppX do Windows travou; resolveu reiniciando. Instalados: gitleaks 8.30.1 (pasta do pacote no PATH do usuário) e Docker Desktop 4.100.1.
- Sessões do Claude Code abertas antes de uma instalação herdam o PATH antigo: nesses casos, chamar pelo caminho completo ou abrir uma sessão nova.
- 27/11: erro meu na descoberta. Dei o WSL2 como instalado porque o `wsl.exe` existia, mas ele é só um atalho presente em todo Windows 11; o WSL não estava instalado. Também recomendei Docker sem olhar RAM e disco. Lição: antes de propor uma pilha local pesada, medir RAM, núcleos e disco livre.
- 27/11: histórico varrido com gitleaks (limpo); hook ativo (`npm run prepare`) e testado nos dois sentidos.
- Ao retomar: seguir o plano da Fase 1 (tarefas F1.1 a F1.11 em [TASKS.md](TASKS.md)). Antes do merge da PR 1a, o autor recria o projeto Supabase em São Paulo e cadastra o segredo `SUPABASE_DB_URL` (URI do session pooler) no GitHub.
- Produção: só o domínio `englishflix-pearl.vercel.app` é público; os endereços longos de deploy pedem login da Vercel (esperado).
- Vercel: projeto `englishflix` (`prj_75oI0hLlUVYmTV8cMuEae16l9CtC`) no time `team_TJPbgfxkBJ9lqXbpyUbk8O2R`, Node 26.x, região `iad1`. O conector consegue ler projeto e deploys, mas não criar projeto.
- Supabase: organização "Portifolio Duarte" no limite do plano gratuito (2 projetos ativos). O projeto `englishflix` em us-east-2 (ref `kqqktrplaylqhevdldtk`, vazio) será trocado por um em `sa-east-1` (ADR 0004).
- Máquina de desenvolvimento: Celeron N4020 (2 núcleos), 3,7 GB de RAM, disco C: com cerca de 2 GB livres. Rodar um processo pesado por vez e evitar ferramentas que exigem Docker ou muita RAM.
- 27/11: o conector da Vercel (MCP) recebeu 403 ao criar projeto no time `team_TJPbgfxkBJ9lqXbpyUbk8O2R`. Ele serve para consultar, mas a criação foi feita pelo painel.
- Se o `npx ruflo` falhar com ENOENT no `package.json` de `npm-cache\_npx\<hash>`, apagar essa pasta: é um download interrompido (aconteceu quando a sessão caiu).
- Abrir na Fase 2: ADR de CSP (nonce) e direção visual (`impeccable`).
- Fase 2: o `supabase/config.jsonc` vem com auth fraco por padrão (`minimum_password_length: 6`, `enable_confirmations: false`, `site_url` em `127.0.0.1:3000`). O prompt exige verificação de e-mail e senha forte: ajustar junto com o fluxo de cadastro.
- A CLI do Supabase 3.4.0 usa `config.jsonc` (não mais `config.toml`) e oferece uma pilha local experimental (`SUPABASE_EXPERIMENTAL_STACK=1`); ficamos na pilha estável.

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
- 27/11/2026: o `shadcn init` (CLI 4.23) troca `clsx` + `tailwind-merge` pelo pacote `cn` (oficial, do autor do shadcn) e espera a fonte em `--font-sans`. O layout do `create-next-app` usava `--font-geist-sans`, e a fonte caía no padrão do navegador até a variável ser renomeada. As dependências instaladas por antecipação e não usadas (`clsx`, `tailwind-merge`, `lucide-react`) foram removidas. Lição: deixar o CLI instalar o que ele usa.
- Ruflo 3.80.11 (pacote oficial `ruflo`, ruvnet), 27/11/2026, rodado de fora do repositório, sem `init` nem hooks: `analyze code` dos tipos security, quality e complexity em `app/`, `lib/`, `scripts/` e `e2e/` (7 arquivos). Resultado: 0 padrões de segurança, nenhum TODO, aninhamento máximo de 3 níveis. Limitação: varredura estática por padrões; não cobre configs, o workflow do CI nem SQL (ainda não há), e não substitui testes, lint e revisão. Relatório: [reviews/2026-11-27-ruflo-fase0.txt](reviews/2026-11-27-ruflo-fase0.txt).

## Cuidados

Nunca guardar credenciais, tokens ou dados pessoais. Marcar decisões substituídas. Não transformar resultados antigos de testes em garantias atuais.
