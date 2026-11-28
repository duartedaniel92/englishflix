# DESIGN — EnglishFlix

Status: regras de UX aprovadas; identidade visual **a definir antes da primeira tela da Fase 2**. Atualização: 27/11/2026.

## Experiência desejada

- Aluno no celular, em sessões curtas (um episódio por vez). Mobile-first a partir de **360 px**.
- Navegação de catálogo (fileiras horizontais de temporadas), mas com **identidade própria**: nada de copiar a marca, as cores ou o logotipo da Netflix.
- Interface em PT-BR, textos curtos e claros. Conteúdo educativo em inglês.
- O aluno sempre vê o próximo passo. Temporada bloqueada mostra **o que falta** (X/Y episódios, prova), nunca só um cadeado.

## Direção visual

A definir com o autor (skill `impeccable` / `frontend-design`) antes da Fase 2. Evitar: gradiente roxo/azul, card com sombra genérica, emoji como ícone, hero genérico, tudo centralizado.

## Fundamentos

- **Tema escuro por padrão** (`class="dark"` no `<html>`), contraste WCAG 2.2 AA.
- Tokens centralizados em CSS variables no `app/globals.css` (padrão shadcn/ui + Tailwind). Nenhuma cor solta em componente.
- No máximo 2 famílias tipográficas, via `next/font`.
- Movimento respeita `prefers-reduced-motion`.

## Componentes e fluxos

- shadcn/ui (preset `base-nova`, sobre Base UI) como base; componente entra no projeto só quando for usado, com `npx shadcn add <nome>`.
- Fonte provisória: Geist (veio do `create-next-app`). A tipografia definitiva sai da direção visual da Fase 2.
- Todo estado desenhado: carregando (skeleton), vazio (com a próxima ação), erro (com como tentar de novo), sucesso.
- Feedback imediato: UI otimista em "Minha lista" e no progresso; o progresso nunca se perde por falha de rede.
- **Player:** facade (miniatura + botão); o iframe do YouTube só carrega quando o aluno interage. Nunca mascarar nem sobrepor os controles do YouTube.
- **Prova:** timer visível, rascunho salvo, confirmação antes de enviar, resultado com revisão dos erros.

## Acessibilidade e responsividade

- Alvos de toque ≥ 44 px. Navegação completa por teclado, foco visível, `aria` correto, HTML semântico.
- PWA instalável (manifest + service worker do shell).
- Testar em 360 px e em desktop.

## Metas de performance (mobile, 4G)

LCP < 2,5 s · INP < 200 ms · CLS < 0,1. Server Components por padrão, `next/image`, fontes otimizadas, pouco JS no cliente.

## Validação

| Data | O quê | Ambiente | Resultado |
| --- | --- | --- | --- |
| — | Ainda sem telas | — | — |
