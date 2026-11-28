# RULES — EnglishFlix

Atualização: 27/11/2026.

Regras comuns do portfólio: [`_templates/docs/RULES.md`](../../_templates/docs/RULES.md) (caminho local, fora deste repositório). Aqui ficam só as regras de negócio do EnglishFlix e as exceções explícitas às regras comuns. Fonte: [PROMPT_MESTRE.md](PROMPT_MESTRE.md) §4.

## Regras de negócio

**Trilha**
- Níveis em ordem: B1, B2, C1, C2, extensível para "C2+". Cada nível tem várias temporadas em ordem linear.
- Estados da temporada para o aluno: `locked`, `unlocked`, `completed`.

**Episódio e elegibilidade**
- Um episódio conta como concluído com ≥90% do vídeo assistido **e** o quiz do episódio feito.
- Elegível para a prova: concluir ≥80% dos episódios da temporada (padrão, configurável por temporada).

**Prova**
- `start_exam` sorteia N questões do banco (padrão 20; o banco precisa ter pelo menos o dobro) e cria uma tentativa com limite de tempo.
- Só uma tentativa aberta por vez.
- Correção **só no servidor**; o gabarito nunca vai para o navegador.
- Passou (≥70%): libera a próxima temporada, ganha XP e medalha. Reprovou: vê a nota e, na revisão, os erros; a próxima tentativa só depois da espera (padrão 24 h, configurável por temporada).
- Questões de listening usam um trecho do YouTube (início e fim definidos pelo admin).

**Nivelamento**
- Cerca de 25 questões cobrindo B1 a C2. O resultado define a primeira temporada liberada; as anteriores ficam `completed` por nivelamento.
- O aluno pode recusar e começar do B1.

**Prática e engajamento**
- Flashcards: repetição espaçada SM-2 simplificada; as cartas vêm do vocabulário de cada episódio.
- Streak: o dia conta se o aluno concluiu alguma atividade (episódio, quiz, revisão de flashcards ou prova). Fuso `America/Sao_Paulo`.
- XP por ação (episódio, quiz, revisão, prova, temporada). Valores em tabela de configuração, não no código.

**Listas**
- Mais populares: temporadas com mais alunos distintos ativos nos últimos 30 dias.
- Lançamentos: temporadas publicadas nos últimos 30 dias.

## Exceções às regras comuns (decididas pelo autor)

| Regra comum | Exceção no EnglishFlix | Motivo | Data |
| --- | --- | --- | --- |
| Definição de pronto exige Sentry conectado | Sentry fica fora do MVP | Decisão fechada no prompt mestre §2 | 27/11/2026 |
| "Nunca commite sem eu pedir" | Commits locais livres na branch da fase, um por tarefa; criar repositório, dar push e deploy só com ok explícito | O prompt mestre pede commits atômicos por fatia | 27/11/2026 |

## Regras de trabalho (prompt mestre §11)

1. Antes de codar uma fase: plano curto (arquivos, tabelas, riscos) e ok do autor.
2. Lógica crítica (prova, desbloqueio, progresso, RLS) com teste primeiro.
3. Nunca enfraquecer a qualidade para passar no CI (sem `@ts-ignore`, sem pular teste, sem baixar limite).
4. Dependência nova só com justificativa de uma linha.
5. Nada de segredo no código: `.env.local` e `.env.example`.
6. Explicar em linguagem simples o que mudou e por quê.
7. Decisões importantes em `docs/adr/`, uma página cada.
