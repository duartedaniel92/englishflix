# PRD — EnglishFlix

Status: aprovado (escopo do MVP). Responsável: autor do projeto. Atualização: 27/11/2026.

Fonte única da especificação: [PROMPT_MESTRE.md](PROMPT_MESTRE.md). Este documento resume o escopo; se divergir, vale o prompt mestre. Regras comuns do portfólio: [`_templates/docs/RULES.md`](../../_templates/docs/RULES.md) (caminho local, fora deste repositório).

## Problema e público

Quem estuda inglês pelo YouTube assiste a vídeo solto: sem trilha, sem prática ativa e sem saber se evoluiu. O EnglishFlix organiza vídeos reais de canais de ensino em uma trilha do **B1 ao C2**, com a navegação de um catálogo de streaming, tarefas de output depois de cada vídeo e uma prova que libera a etapa seguinte.

Perfis:
- **Aluno:** brasileiro, B1 ou acima, estuda pelo celular. Interface em PT-BR, conteúdo em inglês.
- **Admin:** um único curador (o autor), que cadastra temporadas, episódios e questões.

## Objetivos e sucesso

- O aluno sempre sabe o que fazer a seguir: retomar o vídeo, fazer a tarefa ou fazer a prova.
- O progresso só avança por mérito: ninguém lê o gabarito nem pula temporada por nenhuma rota (provado por teste).
- O progresso nunca se perde: sai do app no meio do vídeo e retoma no mesmo ponto, em outro dispositivo.
- Portfólio: o código sobrevive a um code review sênior (testes de comportamento, README de decisões, commits legíveis).

## Fluxo principal

Cadastro → nivelamento (ou começar do B1) → home com as fileiras → temporada → episódio (vídeo + tarefas) → prova da temporada → próxima temporada liberada.

Caminhos de erro: vídeo removido ou privado (o aluno denuncia, o admin trata), reprovação na prova (nota, revisão dos erros e espera para tentar de novo), queda de rede (o progresso fica guardado e é reenviado).

## Requisitos

| ID | Funcionalidade | Prioridade | Critério de aceite | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | Nivelamento no cadastro, com opção de começar do zero | Alta | O resultado define a primeira temporada liberada; as anteriores ficam `completed` por nivelamento | Aprovado |
| REQ-002 | Navegar por nível e categoria; buscar por título, canal e tema | Alta | A busca encontra termos em PT e EN (full-text + trigram) | Aprovado |
| REQ-003 | Fileiras: continuar assistindo, recomendado, destaque, lançamentos, populares, minha lista, por categoria | Alta | Todas as listas do material original funcionando | Aprovado |
| REQ-004 | Minha lista | Média | Adicionar e remover com UI otimista | Aprovado |
| REQ-005 | Continuar assistindo com a posição exata | Alta | Fechar no meio do vídeo e retomar no mesmo ponto em outro dispositivo | Aprovado |
| REQ-006 | Tarefas do episódio: shadowing, quiz, flashcards (SM-2), escrita com checklist | Alta | O episódio só conclui com as tarefas obrigatórias feitas | Aprovado |
| REQ-007 | Prova da temporada com sorteio e correção no servidor | Alta | 70% para passar; espera configurável entre tentativas; o gabarito nunca chega ao navegador | Aprovado |
| REQ-008 | Streak, meta semanal, XP, medalhas, certificado em PDF | Média | Certificado verificável por código | Aprovado |
| REQ-009 | Conta: perfil, exportar dados (JSON), excluir conta | Alta | Exclusão remove ou anonimiza tudo, inclusive o progresso | Aprovado |
| REQ-010 | Denunciar vídeo quebrado | Média | A denúncia aparece no painel do admin | Aprovado |
| REQ-011 | Admin: níveis, categorias, temporadas, episódios com validação do YouTube, questões, vocabulário, denúncias | Alta | Publicar uma temporada completa só pelo painel | Aprovado |

## Escopo

**MVP:** nível **B1 completo** (estrutura pronta para B2–C2 e "C2+").

**Fora do MVP:** login com Google, modo visitante, e-mail de lembrete, Sentry, analytics, correção de escrita/fala por IA, multi-professor, conteúdo B2–C2.

## Origem da estrutura

Adaptada de um clone de Netflix para cursos (capturas locais em `docs/estrutura-sugerida/`, fora do Git por serem material de terceiros):

| Material original | EnglishFlix |
| --- | --- |
| Curso | Temporada |
| Episódio | Aula (vídeo) ou tarefa |
| Categoria | Categoria temática + nível (B1–C2) |
| Painel admin (categorias, cursos, episódios) | Igual, mais banco de questões e denúncias |
| Listas: categoria, destaque, lançamentos, pesquisa, minha lista, populares, continuar assistindo | Mantidas, mais "Recomendado para o seu nível" |
| Streaming próprio | Player embutido do YouTube |
| Deploy AWS | Vercel + Supabase |

## Checklist de projeto novo (regras comuns §12)

1. **Problema real:** estudo de inglês pelo YouTube sem trilha, sem prática ativa e sem medida de evolução.
2. **Habilidade demonstrada:** regra de negócio no Postgres (RLS + funções `SECURITY DEFINER`), integração com API externa, segurança de ponta a ponta (CSP, rate limit, CAPTCHA, LGPD) e PWA.
3. **Fora do escopo:** ver acima (8 itens).
4. **Fluxo principal:** o aluno faz o nivelamento, assiste aos episódios com tarefas, passa na prova e libera a próxima temporada.
5. **Parte difícil:** prova com sorteio e correção só no servidor, gabarito inacessível e desbloqueio que nenhuma rota consegue pular, provado por testes de RLS.
6. **Deploy em uma semana:** a Fase 0 termina com preview na Vercel; o MVP completo leva 10 fases.

## Dependências e dúvidas

- **Conteúdo:** banco de questões (mínimo ~40 por temporada, 20 sorteadas), nivelamento (~25 questões) e curadoria dos vídeos são trabalho do autor; o sistema não gera isso.
- **YouTube:** vídeos podem ser removidos ou ter a incorporação desativada (daí a revalidação periódica e a denúncia).
- **Planos gratuitos:** o Supabase pausa projetos inativos; o plano Hobby da Vercel é não comercial.
- **E-mail:** o remetente padrão do Supabase tem limite baixo; antes do lançamento, configurar SMTP próprio (ex.: Resend).
- **Idade mínima:** sugestão de 13 anos, a validar com orientação jurídica.
