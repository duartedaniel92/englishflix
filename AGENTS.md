# Documentação do projeto

Antes de implementar, leia as [regras comuns](../_templates/docs/RULES.md) (caminho local do portfólio), as [regras do projeto](docs/RULES.md) e o [CONSTRAINTS.md](CONSTRAINTS.md). **Leia o CONSTRAINTS.md antes de escrever código e não o afrouxe para uma mudança passar.**

A especificação completa está em [docs/PROMPT_MESTRE.md](docs/PROMPT_MESTRE.md). Escopo, decisões e retomada: `docs/PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `TASKS.md` e `MEMORY.md`. Atualize TASKS e MEMORY ao encerrar trabalho relevante; resultados históricos não substituem verificações atuais.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
