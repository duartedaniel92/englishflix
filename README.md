# EnglishFlix

Plataforma **gratuita** para aprender inglês do **B1 ao C2** com vídeos reais do YouTube, organizados como um catálogo de streaming. Cada temporada é um bloco de episódios (vídeo + tarefas de output); a prova no fim da temporada libera a próxima.

> Status: **Fase 0 — fundação** (esqueleto, documentação, CI). Ainda não há funcionalidade para o aluno. Roteiro em [docs/TASKS.md](docs/TASKS.md).

## A parte difícil

O progresso só pode avançar por mérito. A prova sorteia questões e corrige **só no servidor**, o gabarito nunca chega ao navegador e o desbloqueio da próxima temporada não pode ser pulado por nenhuma rota, nem chamando a API do banco direto. Isso fica no Postgres (funções `SECURITY DEFINER` + Row Level Security) e é provado por testes de RLS (a partir da Fase 1).

## Por que existe

Quem estuda pelo YouTube assiste a vídeo solto: sem trilha, sem prática ativa e sem saber se evoluiu. O EnglishFlix cura vídeos de canais de ensino, toca pelo player oficial e adiciona o que falta: shadowing, quiz, flashcards com repetição espaçada, escrita e provas.

## Stack e por quê

| Camada | Escolha | Por quê |
| --- | --- | --- |
| App | Next.js (App Router) + TypeScript estrito | Server Components por padrão, pouco JS no celular; Server Actions no lugar de uma API separada |
| Banco e auth | Supabase (Postgres, Auth, RLS) | Autorização perto do dado: vale para qualquer rota |
| UI | Tailwind CSS + shadcn/ui | Tokens centralizados, componentes acessíveis |
| Validação | Zod | Toda entrada externa validada na fronteira |
| Testes | Vitest + Playwright (+ pgTAP na Fase 1) | Comportamento, não implementação |
| Hospedagem | Vercel + Supabase, planos gratuitos | Custo zero no MVP |

Decisões detalhadas: [docs/adr/](docs/adr/) · limites de qualidade: [CONSTRAINTS.md](CONSTRAINTS.md).

## Como rodar

Pré-requisitos: Node (versão em `.nvmrc`), Docker Desktop (para o Supabase local) e [gitleaks](https://github.com/gitleaks/gitleaks) (usado no pre-commit).

```bash
npm install
cp .env.example .env.local
npx supabase start      # banco local (Docker)
npm run dev             # http://localhost:3000
```

Verificações: `npm run check` (lint + tipos + testes unitários), `npm run test:e2e`, `npm run build`.

## Documentação

[PRD](docs/PRD.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Regras](docs/RULES.md) · [Design](docs/DESIGN.md) · [Tarefas](docs/TASKS.md) · [Memória](docs/MEMORY.md)

## Conteúdo de terceiros

Os vídeos pertencem aos seus canais e são exibidos só pelo player oficial do YouTube, com crédito e link para o canal. O EnglishFlix não baixa vídeos, não remove anúncios e não sugere parceria ou endosso dos canais. Conteúdo é removido se o canal pedir.
