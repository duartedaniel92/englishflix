# PROMPT MESTRE — EnglishFlix

> Cole este arquivo como contexto inicial no Claude Code, dentro da pasta do projeto. Ele é a fonte única de verdade. Se algo aqui conflitar com uma sugestão sua, siga o que está aqui e me avise.

---

## 1. Visão

**EnglishFlix** é uma plataforma **gratuita** com a experiência de um catálogo tipo Netflix, em que o aluno aprende inglês por **input** (assistir vídeos reais do YouTube) e **output** (tarefas ativas), do **B1 ao C2**.

- Cada **temporada** é um bloco de episódios dentro de um nível.
- Cada **episódio** é uma aula (vídeo do YouTube) com tarefas de output.
- Ao fim da temporada há uma **prova**. Só quem passa **libera a próxima temporada**.
- Não hospedamos vídeo. Apenas curamos e tocamos vídeos de canais como Volka English, Real Talk English, Confident English with Kirsty, Easy English Talk, English in Brazil (Carina Fragozo) e similares, pelo **player oficial embutido do YouTube**.

**Quem constrói:** dev full stack iniciante, aprendendo na prática. Explique decisões em linguagem simples, sem teoria desnecessária. Prefira a solução mais simples que atenda o requisito.

**Origem da estrutura:** adaptada de um clone de Netflix para cursos (pasta `estrutura-sugerida/`). Mapeamento:

| Material original | EnglishFlix |
|---|---|
| Curso | Temporada |
| Episódio | Aula (vídeo) ou tarefa |
| Categoria | Categoria temática (Daily Life, Business, Travel...) + Nível (B1–C2) |
| Painel admin (categorias, cursos, episódios) | Igual, mais banco de questões e denúncias |
| Listas: categoria, destaque, lançamentos, pesquisa, minha lista, mais populares, continuar assistindo | Mantidas, mais "Recomendado para o seu nível" |
| Streaming próprio | Player embutido do YouTube |
| Deploy AWS | Vercel + Supabase |

---

## 2. Decisões fechadas (não reabrir sem me perguntar)

| Tema | Decisão |
|---|---|
| Stack | Next.js (App Router) + TypeScript estrito + Supabase (Postgres, Auth, RLS) + Vercel |
| Vídeos | Admin cadastra links do YouTube manualmente. Metadados via YouTube Data API v3. Player oficial (iframe, domínio `youtube-nocookie.com`) |
| Acesso | Cadastro por e-mail e senha com verificação de e-mail. Sem login social e sem modo visitante no MVP |
| Admin | Um único admin (eu) |
| Nivelamento | Teste de nivelamento no cadastro, com opção de começar do zero |
| Prova | Múltipla escolha + completar lacunas/listening. 70% para passar. Tentativas ilimitadas com espera (padrão 24h, configurável por temporada) e questões sorteadas do banco |
| Tarefas de output | Shadowing guiado, quiz rápido por episódio, flashcards de vocabulário (repetição espaçada) e escrita livre com checklist (sem correção automática) |
| UX | Mobile-first, PWA instalável, interface em PT-BR, conteúdo em inglês, tema escuro por padrão |
| Engajamento | Streak diário e meta semanal, XP e medalhas por temporada, certificado de nível em PDF |
| Escopo do MVP | Só o nível **B1 completo** |
| Segurança | RLS + validação Zod, rate limit + CAPTCHA + headers de segurança, LGPD (consentimento, exportar e excluir conta) |
| Qualidade | Vitest (unitário) + Playwright (E2E) + CI no GitHub Actions |
| Fora do MVP | Login com Google, visitante, e-mail de lembrete, Sentry, analytics, correção de escrita/fala por IA, multi-professor |

---

## 3. Histórias de usuário

**Aluno**
1. Faço o teste de nivelamento e começo na temporada certa.
2. Navego por nível e categoria, e pesquiso por título, canal e tema.
3. Vejo lançamentos, destaques e as temporadas mais populares.
4. Salvo temporadas em "Minha lista".
5. Retomo de onde parei ("Continuar assistindo", com a posição exata do vídeo).
6. Faço as tarefas de cada episódio (shadowing, quiz, flashcards, escrita).
7. Faço a prova da temporada e vejo nota e erros. Ao passar, a próxima temporada é liberada.
8. Acompanho streak, meta semanal, XP, medalhas e baixo meu certificado de nível.
9. Gerencio minha conta e posso exportar ou excluir meus dados.
10. Aviso quando um vídeo está quebrado, privado ou removido.

**Admin**
1. Cadastro categorias e níveis.
2. Cadastro temporadas (ordem, capa, status rascunho/publicado, destaque, nota mínima, espera entre tentativas).
3. Adiciono episódios colando o link do YouTube. O sistema valida o vídeo (existe, pode ser embutido) e puxa título, canal, duração e thumbnail.
4. Mantenho o banco de questões (prova, nivelamento, quiz) e o vocabulário de cada episódio.
5. Destaco temporadas e categorias.
6. Trato denúncias de vídeo quebrado.

---

## 4. Regras de negócio

- **Trilha:** níveis em ordem (B1, B2, C1, C2, extensível para "C2+"). Cada nível tem várias temporadas em ordem linear.
- **Estados da temporada para o aluno:** `locked`, `unlocked`, `completed`.
- **Elegibilidade para a prova (padrão, configurável):** concluir pelo menos 80% dos episódios da temporada. Um episódio conta como concluído com ≥90% do vídeo assistido **e** o quiz do episódio feito.
- **Prova:**
  - `start_exam` sorteia N questões do banco (padrão 20; o banco deve ter no mínimo o dobro) e cria uma tentativa com limite de tempo.
  - Só uma tentativa aberta por vez.
  - A correção é **só no servidor**. O gabarito nunca vai para o navegador.
  - Passou (≥70%): libera a próxima temporada, ganha XP e medalha. Reprovou: mostra nota e, na revisão, os erros. A próxima tentativa só depois da espera configurada.
  - Questões de listening usam um trecho do YouTube (início e fim definidos pelo admin).
- **Nivelamento:** cerca de 25 questões cobrindo B1 a C2. O resultado define a primeira temporada liberada. As anteriores ficam `completed` por nivelamento. O aluno pode recusar e começar do B1.
- **Flashcards:** repetição espaçada simples (algoritmo SM-2 simplificado). Cartas vêm do vocabulário de cada episódio.
- **Streak:** dia conta se o aluno concluiu alguma atividade (episódio, quiz, revisão de flashcards ou prova). Fuso `America/Sao_Paulo`.
- **XP:** concedido por ação (episódio, quiz, revisão, prova, temporada). Valores em uma tabela de configuração, não no código.
- **Mais populares:** temporadas com mais alunos distintos ativos nos últimos 30 dias.
- **Lançamentos:** temporadas publicadas nos últimos 30 dias.

---

## 5. Modelo de dados (Postgres/Supabase)

Use migrations do Supabase CLI. Todas as tabelas com `id uuid`, `created_at`, `updated_at`. **RLS ligado em todas.**

- `profiles` (id = auth.users.id, display_name, current_level, placement_done, xp, streak_current, streak_best, last_activity_date, weekly_goal_minutes, consented_at, terms_version)
- `levels` (code `B1..C2`, position)
- `categories` (name, slug, featured)
- `seasons` (level_id, position, title, description, cover_url, status, featured, published_at, exam_pass_score, exam_question_count, retake_cooldown_hours, min_watched_pct)
- `season_categories` (season_id, category_id)
- `episodes` (season_id, position, title, youtube_video_id, channel_name, channel_url, duration_s, thumbnail_url, start_s, end_s, status, embeddable_checked_at, is_broken)
- `vocabulary` (episode_id, term, definition_pt, example)
- `quiz_questions` (episode_id, prompt, options jsonb) e `quiz_answer_keys` (separada, sem acesso do aluno)
- `exam_questions` (season_id ou placement, type `mcq|cloze|listening`, prompt, options jsonb, media_video_id, media_start_s, media_end_s) e `exam_answer_keys` (separada, sem acesso do aluno)
- `exam_attempts` (user_id, season_id, question_ids, answers, score, passed, started_at, expires_at, submitted_at)
- `user_season_state` (user_id, season_id, state, unlocked_at, completed_at, source `exam|placement|start`)
- `episode_progress` (user_id, episode_id, position_s, watched_pct, completed_at, quiz_score, shadowing_done, writing_text)
- `flashcard_reviews` (user_id, vocabulary_id, ease, interval_days, due_at)
- `my_list` (user_id, season_id)
- `xp_events` (user_id, kind, amount, ref_id), `badges`, `user_badges`
- `certificates` (user_id, level_id, issued_at, code)
- `video_reports` (user_id, episode_id, reason, status)
- `audit_log` (actor_id, action, entity, entity_id, meta)
- Views ou funções para: continuar assistindo, mais populares, lançamentos, recomendado para o nível.

**Funções SQL (`SECURITY DEFINER`, com `search_path` fixo):** `start_exam`, `submit_exam`, `unlock_next_season`, `record_progress`, `award_xp`, `touch_streak`, `export_my_data`, `delete_my_account`.

---

## 6. Backend

- Supabase Auth (e-mail e senha) com cookies httpOnly via `@supabase/ssr`.
- Lógica de domínio fica no **Postgres (funções + RLS)** e em **Server Actions / Route Handlers** do Next.js. Sem servidor Express separado.
- Contrato de entrada/saída com **Zod** em toda fronteira. Tipos do banco gerados pelo Supabase CLI.
- Endpoints/ações principais: catálogo (listas), busca (full-text em português e inglês + trigram), detalhe da temporada, progresso do vídeo (a cada ~10 s e ao pausar), minha lista, quiz, flashcards, prova (start/submit), nivelamento, perfil, exportar/excluir conta, denúncia de vídeo; no admin: CRUD de níveis, categorias, temporadas, episódios, questões e denúncias.
- **YouTube:** ao cadastrar um episódio, chamar `videos.list` (`snippet,contentDetails,status`) no servidor com a chave em variável de ambiente. Recusar vídeo com `embeddable=false`, privado ou inexistente. Guardar os metadados e revalidar periodicamente (job agendado simples) para marcar `is_broken`. Respeitar a cota diária da API.
- Paginação por cursor nas listas. Índices nas chaves de busca e nas colunas de filtro. Sem N+1.
- Erros no formato único `{ code, message }`, sem vazar detalhes internos.

---

## 7. Frontend e UX

**Telas públicas:** landing, cadastro, login, recuperar senha, termos e privacidade.

**Telas do aluno:** nivelamento, home (fileiras de temporadas: Continuar assistindo, Recomendado para você, Em destaque, Lançamentos, Mais populares, Minha lista, por categoria), busca com resultados, detalhe da temporada (episódios + card da prova com status), player do episódio (vídeo + abas: tarefas, vocabulário, escrita), revisão de flashcards, prova, resultado da prova, perfil e conta (streak, meta, XP, medalhas, certificados, exportar/excluir dados).

**Admin (`/admin`):** dashboard, níveis e categorias, temporadas, episódios (com preview do vídeo ao colar o link), banco de questões, denúncias.

**Regras de UX (obrigatórias):**
- Mobile-first, a partir de 360 px. Alvos de toque ≥ 44 px. PWA instalável (manifest + service worker para o shell).
- Tema escuro por padrão, com contraste WCAG 2.2 AA. Navegação completa por teclado, foco visível, `aria` correto, `prefers-reduced-motion` respeitado.
- Todo estado desenhado: carregando (skeleton), vazio (com próxima ação), erro (com como tentar de novo), sucesso.
- Feedback imediato (UI otimista no "Minha lista" e no progresso). Nunca perder o progresso do aluno por falha de rede.
- Temporada bloqueada mostra **o que falta** para liberar (X/Y episódios, prova), nunca só um cadeado.
- Prova: timer visível, salvar rascunho das respostas, confirmação antes de enviar, resultado com revisão dos erros.
- Textos de interface curtos e claros em PT-BR. Conteúdo educativo em inglês.
- Componentes com shadcn/ui + Tailwind. Design tokens centralizados.
- **Player:** usar "facade" (miniatura + botão) e só carregar o iframe do YouTube ao interagir. Não mascarar nem sobrepor os controles do YouTube.

**Performance (metas):** LCP < 2,5 s, INP < 200 ms, CLS < 0,1 no mobile em 4G. Server Components por padrão, `next/image`, fontes otimizadas, JS mínimo no cliente, cache e revalidação nas listas públicas.

---

## 8. Segurança (tudo isto faz parte do "pronto")

**Autenticação e autorização**
- Verificação de e-mail obrigatória. Política de senha forte. Mensagens de erro que não revelam se o e-mail existe.
- Papel de admin guardado em **`app_metadata`** (nunca em `user_metadata`, que o usuário edita). Rotas `/admin` checadas no servidor **e** por RLS.
- Chave `service_role` só no servidor, nunca em código cliente nem em variável `NEXT_PUBLIC_*`.

**Dados**
- RLS em todas as tabelas, com política mínima (o aluno só lê e escreve os próprios dados). Tabelas de gabarito sem nenhum acesso do aluno.
- Funções `SECURITY DEFINER` com `search_path` fixo e validação interna de `auth.uid()`.
- **Testes de RLS** automatizados (aluno A não vê dados do aluno B; aluno não lê gabarito; não-admin não escreve catálogo).

**Aplicação**
- Validação Zod em todas as entradas. Sem HTML do usuário renderizado sem sanitizar (texto de escrita livre sempre como texto).
- Rate limit (Upstash Ratelimit, plano gratuito) em login, cadastro, recuperar senha, start/submit de prova, denúncia e escrita.
- CAPTCHA (Cloudflare Turnstile) no cadastro, recuperar senha e após falhas de login.
- Headers: CSP com nonce (permitir só `youtube-nocookie.com` e o necessário), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`. Proteção CSRF (verificação de origem nas Server Actions, cookies `SameSite`).
- Anti-trapaça na prova: sorteio e correção no servidor, tentativa com expiração, uma aberta por vez, espera entre tentativas.

**Cadeia de suprimentos e operação**
- Dependabot, `npm audit` no CI, `gitleaks` no pre-commit e no CI, lockfile versionado. Segredos só em variáveis de ambiente da Vercel/Supabase.
- Logs sem dados pessoais. `audit_log` para ações de admin.
- Backup: o plano gratuito do Supabase não tem recuperação pontual, então agendar `pg_dump` periódico via GitHub Action para armazenamento privado.

**LGPD**
- Política de privacidade e termos, **aceite registrado** (versão e data) no cadastro. Coletar só o necessário. Idade mínima declarada no cadastro (sugestão: 13 anos; validar com orientação jurídica).
- Exportar meus dados (JSON) e excluir minha conta (remove ou anonimiza tudo, incluindo progresso).
- Canal de contato do responsável pelos dados na página de privacidade.

**YouTube**
- Somente player oficial embutido. Nunca baixar, copiar, remover anúncios nem esconder controles. Dar crédito ao canal com link. Remover o conteúdo se o canal pedir. Não sugerir parceria ou endosso dos canais.

---

## 9. Ferramentas e skills (use ao longo do trabalho)

- **Planejar e especificar:** `agent-skills:spec`, `agent-skills:plan`, `agent-skills:constraints` (gera `CONSTRAINTS.md`).
- **Implementar:** `agent-skills:build`, `agent-skills:test` (TDD), `agent-skills:api-and-interface-design`, `agent-skills:incremental-implementation`.
- **Frontend:** `agent-skills:frontend-ui-engineering`, `impeccable` (design), `vercel-react-best-practices`, `web-design-guidelines`, `webapp-testing`.
- **Segurança:** `agent-skills:security-and-hardening` e o agente `agent-skills:security-auditor`.
- **Performance:** `agent-skills:performance-optimization`, `agent-skills:webperf`.
- **Revisão e entrega:** `agent-skills:review`, `agent-skills:ship`, `agent-skills:ci-cd-and-automation`, `agent-skills:git-workflow-and-versioning`.
- **MCPs:** Supabase (migrations, advisors de segurança, logs), Vercel (deploy), Figma (se eu fizer mockups).
- Rode `get_advisors` do Supabase (segurança e performance) ao fim de cada fase que mexer no banco.

---

## 10. Fases e critérios de aceite

Trabalhe **uma fase por vez**, em fatias pequenas, com commits atômicos. Ao fim de cada fase: testes verdes, lint e tipos limpos, e me mostre o que ficou pronto antes de seguir.

0. **Fundação:** repositório, Next.js + TS estrito, Tailwind + shadcn, Supabase local, `CONSTRAINTS.md`, CI (lint, tipos, testes, audit, gitleaks). *Aceite:* CI verde no primeiro push, deploy de preview na Vercel.
1. **Banco e RLS:** migrations, seeds de B1, funções SQL, testes de RLS. *Aceite:* testes de RLS passando, advisors do Supabase sem alertas críticos.
2. **Auth e conta:** cadastro/login/recuperação, verificação de e-mail, perfil, aceite de termos, Turnstile, rate limit. *Aceite:* fluxo E2E de cadastro até a home.
3. **Admin:** níveis, categorias, temporadas, episódios com validação do YouTube, banco de questões, vocabulário. *Aceite:* publicar uma temporada completa só pelo painel.
4. **Catálogo do aluno:** home com fileiras, busca, detalhe da temporada, minha lista, populares, lançamentos. *Aceite:* todas as listas do material original funcionando.
5. **Player e progresso:** player com facade, posição salva, continuar assistindo, conclusão do episódio. *Aceite:* fechar o app no meio do vídeo e retomar no mesmo ponto em outro dispositivo.
6. **Tarefas de output:** quiz do episódio, flashcards com repetição espaçada, shadowing guiado, escrita com checklist. *Aceite:* episódio só conclui com as tarefas obrigatórias feitas.
7. **Provas e desbloqueio:** nivelamento, prova com sorteio e correção no servidor, espera entre tentativas, liberação da próxima temporada. *Aceite:* aluno não consegue ler gabarito nem pular temporada por nenhuma rota (testado).
8. **Engajamento:** streak, meta semanal, XP, medalhas, certificado em PDF. *Aceite:* certificado gerado e verificável por código.
9. **Endurecimento e lançamento:** auditoria de segurança, a11y (WCAG AA), Core Web Vitals, E2E dos fluxos críticos, backups, página de privacidade, checklist `agent-skills:ship`. *Aceite:* go/no-go documentado.

---

## 11. Regras de trabalho para o agente

1. Antes de codar uma fase, me mostre o plano curto (arquivos, tabelas, riscos) e espere meu ok.
2. Teste primeiro a lógica crítica (prova, desbloqueio, progresso, RLS).
3. Nunca enfraqueça a qualidade para passar no CI (sem `@ts-ignore`, sem pular teste, sem baixar limite). Se precisar, pare e me pergunte.
4. Não adicione dependência sem justificar em uma linha.
5. Nada de segredo no código. Use `.env.local` e `.env.example`.
6. Explique em linguagem simples o que fez e por quê, com foco no que muda no dia a dia.
7. Documente decisões importantes em `docs/adr/` (uma página cada).

---

## 12. Suposições e riscos (confirme ou corrija)

- **Nome do produto:** "EnglishFlix" (do nome da pasta).
- **Conteúdo é trabalho meu:** o banco de questões (mín. ~40 por temporada, 20 sorteadas) e a curadoria dos vídeos precisam ser produzidos por mim. O sistema não gera isso sozinho.
- **Limites dos planos gratuitos:** o Supabase gratuito pausa projetos inativos, e o plano Hobby da Vercel é para uso **não comercial**. Se virar produto com receita, migrar de plano.
- **E-mails de autenticação:** o remetente padrão do Supabase tem limite baixo. Para lançar, configurar SMTP próprio (ex.: Resend, plano gratuito).
- **Dependência do YouTube:** vídeos podem ser removidos ou ter incorporação desativada. Por isso existem a revalidação periódica e a denúncia de vídeo quebrado.
- **Elegibilidade para a prova (80% dos episódios):** assumida por mim, ajustável por temporada.
- **Fora de escopo agora:** B2, C1, C2 (a estrutura já suporta, o conteúdo vem depois).
