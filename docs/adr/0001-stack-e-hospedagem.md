# ADR 0001 — Stack e hospedagem

Status: aceito. Data: 27/11/2026. O item "Supabase local via Docker" foi substituído pelo [ADR 0002](0002-supabase-remoto-e-testes-no-ci.md).

## Contexto

O EnglishFlix é gratuito, feito por um dev só, e precisa de autenticação, regras de acesso fortes (o aluno não pode ler gabarito nem pular temporada) e custo zero de infraestrutura no MVP.

## Decisão

- **Next.js (App Router) + TypeScript estrito** na **Vercel**: Server Components e Server Actions fazem o papel de API; não há servidor Express separado.
- **Modelo clássico de renderização** (`cacheComponents` desligado, embora o `create-next-app` 16.4.6 o ligue por padrão): a CSP com nonce, decisão fechada de segurança, exige renderizar cada página na hora, o que anula a casca estática do Cache Components. O cache das listas públicas fica com `revalidate`.
- **Supabase** (Postgres, Auth, RLS): a regra de negócio crítica fica no banco, em funções `SECURITY DEFINER` com `search_path` fixo e RLS em todas as tabelas. Assim a autorização vale para qualquer rota, inclusive chamadas diretas à API do Supabase.
- **Vídeo pelo player oficial do YouTube**: nada de hospedar vídeo.
- **Supabase local via Docker** (`supabase start`), com a CLI versionada como dependência de desenvolvimento. Migrations e testes de RLS rodam igual na máquina e no CI.

## Consequências

- Boa: autorização perto do dado e testável com pgTAP; preview por PR na Vercel; custo zero.
- Ruim: lógica dividida entre SQL e TypeScript (exige testes nos dois lados); dependência dos limites gratuitos (o Supabase pausa por inatividade, a Vercel Hobby é não comercial); o Docker é obrigatório para desenvolver.
- Reversão: se virar produto com receita, migrar de plano (Vercel Pro, Supabase Pro). O código não muda. Se a CSP mudar de nonce para hashes, reavaliar o Cache Components.
