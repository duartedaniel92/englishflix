# Constraints — EnglishFlix

Última revisão: 27/11/2026. Origem: prompt mestre (§2, §7, §8, §11) e regras comuns do portfólio (§5, §6). Cada número tem o motivo ao lado; um limite sem motivo acaba apagado pela próxima pessoa que esbarrar nele.

Regra de ouro (prompt §11.3): **nunca afrouxar este arquivo para uma mudança passar.** Sem `@ts-ignore`, sem pular teste, sem baixar limite. Se não der, pare e pergunte. Mudança aqui vai em commit próprio, com o motivo.

## Piso (sempre, sem exceção)

| Regra | Mecanismo | Onde roda |
| --- | --- | --- |
| Sem `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` | ESLint `@typescript-eslint/ban-ts-comment` (as três proibidas) | `npm run lint`, CI |
| Sem `eslint-disable` (comentário não desliga regra) | ESLint `linterOptions.noInlineConfig` | `npm run lint`, CI |
| Sem `any` | ESLint `@typescript-eslint/no-explicit-any` | `npm run lint`, CI |
| Sem `catch` vazio, sem `console.log`, sem `TODO`/`FIXME` no código | ESLint `no-empty`, `no-console`, `no-warning-comments` | `npm run lint`, CI |
| Sem teste pulado, focado ou invertido (`.skip`, `.skipIf`, `.runIf`, `.only`, `.todo`, `.fixme`, `.fail`, `.fails`) | ESLint `no-restricted-syntax` nos arquivos de teste; Playwright `forbidOnly` no CI | `npm run lint`, CI |
| Sem segredo no repositório | gitleaks (`--redact`: o relatório mostra a regra e o local, nunca o valor) | pre-commit, CI |
| Sem chave secreta em variável `NEXT_PUBLIC_*` (iria para o JavaScript do navegador) | `assertNoPublicSecrets()` chamado no `next.config.ts` | `next build`, `next dev` |

## Com números (bloqueiam o merge)

| Dimensão | Regra | Verificado por | Onde roda | Por quê |
| --- | --- | --- | --- | --- |
| Tipos | zero erros | `npm run typecheck` | fim de tarefa, CI | TypeScript estrito (prompt §2) |
| Lint | zero erros | `npm run lint` | fim de tarefa, CI | Carrega o piso acima |
| Testes | todos verdes | `npm test`, `npm run test:e2e` | fim de tarefa, CI | Lógica crítica com teste primeiro (prompt §11.2) |
| Build | sem erro | `npm run build` | CI | Definição de pronto do portfólio |
| Dependências | nada de severidade `high` ou acima | `npm audit --audit-level=high` | CI | Abaixo de `high` costuma ser ruído; achado sem correção é registrado com alcance e fonte, nunca escondido |
| Segredos | nenhum achado | `gitleaks` (staged no pre-commit, histórico no CI) | pre-commit, CI | Repositório público |

Atalho de fim de tarefa: `npm run check` (lint + typecheck + testes unitários). Ele espelha este arquivo; se divergirem, vale este arquivo.

## Metas com ferramenta planejada (ainda não bloqueiam)

| Dimensão | Meta | Ferramenta | Passa a bloquear em |
| --- | --- | --- | --- |
| RLS | Aluno A não vê dados do B; aluno não lê gabarito; não-admin não escreve catálogo | pgTAP (`supabase test db`) | Fase 1 |
| Banco | Advisors do Supabase sem alerta crítico | MCP do Supabase (`get_advisors`) | Fim de cada fase que mexer no banco |
| Prova | Nenhuma rota permite ler gabarito nem pular temporada | pgTAP + E2E | Fase 7 |
| Performance (mobile, 4G) | LCP ≤ 2500 ms, INP ≤ 200 ms, CLS ≤ 0,1 | Lighthouse contra o preview | Fase 9 (prompt §7) |
| Acessibilidade | Zero violação `critical`/`serious` (WCAG 2.2 AA) | axe-core nos fluxos críticos | Fase 9 (prompt §7) |

## Cobertura

Sem número de cobertura (regras comuns §6: cobrir os caminhos que importam, não perseguir porcentagem). Obrigatório e checado na revisão: teste de comportamento em prova, desbloqueio, progresso, RLS, autenticação e validação de entrada.

## Limites externos

| Recurso | Limite | Consequência no código |
| --- | --- | --- |
| YouTube Data API v3 | Cota diária padrão de 10.000 unidades; `videos.list` custa 1 | Guardar metadados no banco; revalidar em lote (até 50 IDs por chamada) |
| Supabase (plano gratuito) | Pausa após inatividade; sem recuperação pontual | Keepalive diário; `pg_dump` agendado (Fase 9) |
| Supabase Auth (remetente padrão) | Limite baixo de e-mails por hora | SMTP próprio (ex.: Resend) antes do lançamento |
| Vercel Hobby | Uso não comercial | Migrar de plano se houver receita |
| Upstash, Turnstile (planos gratuitos) | Cotas mensais | Rate limit só nas rotas sensíveis (prompt §8) |

## Exceções

| ID | Regra | Caminho | Motivo | Dono | Expira |
| --- | --- | --- | --- | --- | --- |
| — | Nenhuma | — | — | — | — |

Exceção nova exige dono e data de expiração (no máximo 90 dias) e é discutida antes, nunca adicionada junto com a mudança que falhava.
