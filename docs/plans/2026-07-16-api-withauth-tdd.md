# Plano TDD — Unificação de auth da API (`withAuth` em todas as rotas)

**Executor:** agente sênior · **Revisor:** Bruno (gates por fase) · **Data:** 2026-07-16

## Objetivo

Permitir que agentes externos (Claudes) operem a API inteira com API key (Bearer):
ler issues, criar issues, mudar status. Hoje só `GET/POST /api/issues` e
`POST /api/issues/bulk` aceitam Bearer; todo o resto exige cookie de sessão.
Junto: remover o endpoint inseguro `/api/generate-token` e endurecer a
comparação da API key.

**Fora de escopo:** múltiplas API keys por agente; revisão do `/api/auth/register`
público; rate limiting (registrar como issues futuras).

## Decisões técnicas já tomadas

1. **`withAuth` precisa repassar o contexto de rota.** Assinatura atual
   `handler(req, userId)` não funciona para rotas dinâmicas (`[id]` recebe
   `{ params }` como 2º argumento). Nova assinatura retrocompatível:
   `withAuth((req, userId, ctx) => ...)` onde `ctx` é o
   `{ params: Promise<...> }` do App Router, repassado intacto.
2. **Continuam públicos:** `GET /api/health` (health check do deploy),
   `OPTIONS` (preflight CORS), `/api/auth/*` (NextAuth, register, signout).
3. **Comparação timing-safe:** `crypto.timingSafeEqual` sobre os hashes SHA-256
   (os buffers têm tamanho fixo, então `timingSafeEqual` é aplicável direto).
4. **`/api/generate-token` é removido**, não corrigido — o item 1 elimina sua
   razão de existir. A rotação do `AUTH_SECRET` (runbook final) invalida os
   tokens de 30 dias já emitidos por ele.
5. **Side effects de status são intocáveis** e cobertos por teste antes do
   refactor: `firstResponseAt` (→ IN_PROGRESS), `resolvedAt` +
   `resolutionTimeMinutes` (→ DONE), `reopenCount` (DONE → não-DONE).
6. **E2E = servidor real + SQLite real** (nada de mock): `next build`,
   `node .next/standalone/server.js` (mesmo modo de produção), banco temporário
   criado com `prisma migrate deploy`, requests HTTP com `fetch`.

## Regras do jogo (TDD)

- Ciclo por commit: **RED** (teste novo falhando) → **GREEN** (implementação
  mínima) → **REFACTOR** → commit. Nunca commitar com suíte vermelha.
- Antes de cada commit: `pnpm test -- --run && pnpm lint && pnpm build`.
- Cada commit é atômico e descreve o comportamento, não o diff.
- Mocks seguem o padrão existente (`vitest.setup.ts` auto-mocka `@/lib/auth` e
  `@/lib/prisma`; cast `auth as unknown as ReturnType<typeof vi.fn>`).

---

## Fase 1 — Fundação do `withAuth`

### Commit 1 · `feat(api-auth): withAuth repassa contexto de rota e compara API key em tempo constante`

**RED** — em `__tests__/unit/auth.test.ts`, adicionar:
- `withAuth` repassa `ctx` (3º argumento) ao handler quando a rota dinâmica o
  fornece; handlers antigos de 2 argumentos seguem funcionando.
- Bearer válido em rota dinâmica → handler recebe `(req, userId, ctx)`.
- Comparação usa `crypto.timingSafeEqual` (espionar/verificar que `===` não é
  usado sobre os hex strings; testar chaves de tamanhos diferentes → 401 sem
  exceção).
- `API_KEY` ausente no env + Bearer qualquer → 401 (não cai no fallback de
  sessão).

**GREEN** — `src/lib/api-auth.ts`: nova assinatura + `timingSafeEqual`.

**Gate de revisão:** assinatura retrocompatível confirmada (as 4 rotas já em
`withAuth` não mudam); nenhum comportamento de sessão alterado.

---

## Fase 2 — Migração das rotas para `withAuth` (3 commits, mesma receita)

Receita por rota (repetir para cada arquivo):
1. **RED**: teste unit importando o handler da rota com Bearer válido no header
   → espera 200/2xx e a query Prisma correta com o `userId` da key; sem
   credencial → 401; sessão válida → continua funcionando (fallback).
2. **GREEN**: trocar o bloco inline `const session = await auth(); if (!session...)`
   pelo wrapper `withAuth`, preservando corpo, zod schema, `withCors` e erros.
3. Rodar a suíte inteira (regressão) antes do commit.

### Commit 2 · `refactor(api): issues/[id], issues/reorder e issues/[id]/time aceitam API key`
Testes obrigatórios além da receita — side effects do PATCH `[id]`:
- mover para IN_PROGRESS seta `firstResponseAt` (só na 1ª vez);
- mover para DONE seta `resolvedAt` e calcula `resolutionTimeMinutes` em horas
  úteis;
- sair de DONE incrementa `reopenCount` e limpa `resolvedAt`;
- DELETE e GET `[id]` com Bearer.

### Commit 3 · `refactor(api): projects, workspaces e milestones aceitam API key`
Cobre: `projects` (GET/POST), `projects/[id]` (GET/PATCH/DELETE),
`projects/reorder`, `workspaces` + `[id]`, `milestones` + `[id]` + `reorder`.

### Commit 4 · `refactor(api): labels, features, time-entries e time-tracking aceitam API key`
Cobre: `labels`, `features`, `time-entries` (POST/GET), `time-entries/[id]`
(PATCH/DELETE — start/stop do timer), `time-tracking`.

**Gate de revisão (fim da fase):** diff de cada rota deve ser ~mecânico
(wrapper trocado, corpo intacto). Reprovar qualquer mudança de lógica de
negócio embutida no refactor.

---

## Fase 3 — Remoção do generate-token + trava de arquitetura

### Commit 5 · `feat(api)!: remove /api/generate-token e trava auth inline por teste de arquitetura`

**RED** — novo `__tests__/unit/api-architecture.test.ts`:
- varre `src/app/api/**/route.ts` (glob via `fs`) e falha se algum arquivo fora
  da allowlist (`health`, `auth/*`) contiver `await auth()` inline ou não
  referenciar `withAuth` — impede regressão futura por qualquer agente;
- falha se `src/app/api/generate-token/` existir.

**GREEN** — deletar `src/app/api/generate-token/`; ajustar allowlist.

**Gate de revisão:** confirmar que nada no frontend referencia
`/api/generate-token` (`grep -r generate-token src/ scripts/`).

---

## Fase 4 — E2E (servidor real, banco real)

### Commit 6 · `test(e2e): infra vitest + fluxo completo de agente via API key`

**Infra** (`__tests__/e2e/`, `vitest.e2e.config.ts`, script `test:e2e`):
- `globalSetup`: cria SQLite temporário (`prisma migrate deploy` +
  `db:seed`), builda se necessário e sobe `node .next/standalone/server.js`
  com `PORT=3100`, `API_KEY=e2e-test-key`, `AUTH_SECRET` dummy; espera
  `/api/health` = 200; teardown mata o processo e apaga o banco.
- **Não** roda no `pnpm test` padrão (config separada), roda via `pnpm test:e2e`.

**Cenários (na ordem — simulam exatamente o fluxo dos Claudes):**
1. Sem Authorization → 401 em `GET /api/issues`, `GET /api/projects`,
   `PATCH /api/issues/x`.
2. Bearer errado → 401.
3. `GET /api/workspaces` e `GET /api/projects` com Bearer → 200 (dados do seed).
4. `POST /api/issues` com Bearer → cria; `GET /api/issues` lista; 
   `GET /api/issues/[id]` lê a criada.
5. `PATCH /api/issues/[id]` → IN_PROGRESS: resposta traz `firstResponseAt`
   preenchido; → DONE: `resolvedAt` + `resolutionTimeMinutes`; → reabrir:
   `reopenCount` = 1.
6. `POST /api/issues/bulk` com 3 issues → 3 criadas.
7. `PUT/POST /api/issues/reorder` com Bearer → 200 e ordem persistida.
8. `POST /api/generate-token` → 404.
9. Preflight `OPTIONS /api/issues` → 2xx com headers CORS.
10. `GET /api/health` sem auth → 200.

**Gate de revisão:** suíte e2e verde 3 execuções seguidas localmente
(sem flakiness); tempo total < 2 min.

---

## Fase 5 — CI e documentação

### Commit 7 · `ci: adiciona job e2e ao workflow`
- Novo job `e2e` em `.github/workflows/ci.yml` (paralelo ao `app`): pnpm
  install → build → `pnpm test:e2e`. CD continua dependendo do workflow CI
  inteiro (os dois jobs) ficar verde.

### Commit 8 · `docs: API key vale para toda a API; remove instruções do generate-token`
- Atualizar `scripts/API-KEY-AUTH.md` (endpoints suportados = todos),
  `CLAUDE.md` (padrão de rota, seção de testes com `test:e2e`) e README
  (seção de testes).

---

## Revisão final + deploy (com Bruno)

1. `/code-review` no diff completo do branch antes do push.
2. Push → CI (unit + e2e) verde → **aprovação manual do CD** (Bruno).
3. **Runbook pós-deploy — rotação de secrets (obrigatório, invalida tokens do
   generate-token e cumpre o advisory do CVE-2025-66478):**
   - gerar novos `AUTH_SECRET` e `API_KEY` (`openssl rand -base64 32`);
   - atualizar no servidor (vault do Ansible / `.env` de produção) e
     redeployar;
   - atualizar a key nos agentes Claude externos;
   - smoke: login web ok + `GET /api/issues` com a key nova = 200, com a
     antiga = 401.

## Critérios de aceite (checklist do revisor)

- [ ] Toda rota de negócio aceita Bearer **e** sessão; 401 sem credencial.
- [ ] Side effects de SLA cobertos por unit **e** e2e, comportamento idêntico.
- [ ] `generate-token` inexistente (código, docs e produção → 404).
- [ ] Teste de arquitetura impede rota nova sem `withAuth`.
- [ ] Comparação de API key timing-safe.
- [ ] CI com unit + e2e; CD inalterado (gate manual).
- [ ] Frontend sem nenhuma mudança de comportamento (sessão continua igual).
- [ ] Secrets rotacionados pós-deploy.
