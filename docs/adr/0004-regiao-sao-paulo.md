# ADR 0004 — Região: banco e funções em São Paulo

Status: aceito. Data: 27/11/2026.

## Contexto

O público é brasileiro. Por causa da CSP com nonce, cada página é renderizada na hora, então a distância entre o aluno, as funções da Vercel e o banco entra no tempo de cada página. O projeto Supabase existente estava vazio em us-east-2 (Ohio), e as funções da Vercel rodavam em `iad1` (Washington). O plano Hobby da Vercel aceita qualquer região única de funções, configurável no `vercel.json`.

## Decisão

- Banco no Supabase em **`sa-east-1` (São Paulo)**. O projeto vazio de Ohio foi trocado por um novo, o que só era barato porque ele estava vazio.
- Funções da Vercel em **`gru1` (São Paulo)**, via `"regions": ["gru1"]` no `vercel.json`, a partir da Fase 2 (quando o app passa a consultar o banco).

## Consequências

- Boa: cerca de 100 ms a menos por página para o aluno no Brasil; banco e funções na mesma cidade, então cada consulta do servidor leva poucos milissegundos.
- Ruim: quem acessa de fora do Brasil paga a distância (não é o público do MVP).
- Reversão: trocar a região do banco depois exige migrar os dados; trocar a das funções é uma linha no `vercel.json`.
