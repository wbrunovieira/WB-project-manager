# 🔐 Autenticação da API — Bearer Token (API Key)

Toda a API aceita autenticação via **API Key** (header `Authorization: Bearer`)
além do cookie de sessão do navegador. Isso vale para **todos os endpoints de
negócio** — leitura, criação, atualização de status, delete, reorder, bulk —
não só para criação de issues.

> ⚠️ **A API key NUNCA é commitada.** Ela vive no `.env` do servidor (gerada na
> rotação de secrets) e na configuração dos agentes externos. Nos exemplos
> abaixo, exporte `API_KEY` no seu shell antes de rodar.

---

## Como usar

```
Authorization: Bearer $API_KEY
```

```bash
export API_KEY="<a key fornecida fora do repo>"

curl -X POST https://projects.wbdigitalsolutions.com/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "title": "Sua Issue Aqui",
    "workspaceId": "<workspace-id>",
    "statusId": "<status-id>",
    "priority": "HIGH",
    "type": "FEATURE"
  }'
```

### Python

```python
import os, requests

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.environ['API_KEY']}",
}
issues = requests.get(
    "https://projects.wbdigitalsolutions.com/api/issues", headers=headers
).json()
```

---

## Endpoints (todos aceitam Bearer)

| Recurso | Endpoints |
|---|---|
| Issues | `GET/POST /api/issues`, `GET/PATCH/DELETE /api/issues/[id]`, `POST /api/issues/bulk`, `POST /api/issues/reorder`, `GET /api/issues/[id]/time` |
| Projects | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`, `POST /api/projects/reorder` |
| Workspaces | `GET/POST /api/workspaces`, `GET/PATCH/DELETE /api/workspaces/[id]` |
| Milestones | `GET/POST /api/milestones`, `GET/PATCH/DELETE /api/milestones/[id]`, `POST /api/milestones/reorder` |
| Labels / Features | `GET/POST /api/labels`, `GET/POST /api/features` |
| Time tracking | `GET/POST /api/time-entries`, `PATCH/DELETE /api/time-entries/[id]`, `GET /api/time-tracking` |

Públicos (sem auth): `GET /api/health` e `OPTIONS` (preflight CORS).
`/api/auth/*` é do NextAuth.

Mudar status de issue via `PATCH /api/issues/[id]` dispara os side effects de
SLA automaticamente (`firstResponseAt`, `resolvedAt`/`resolutionTimeMinutes`,
`reopenCount`).

---

## Comportamento de autenticação

1. Se o header `Authorization: Bearer ...` está presente, **só** a API key é
   avaliada (não há fallback para sessão). Key errada → `401 {"error":"Invalid API key"}`.
2. Sem o header, vale o cookie de sessão do NextAuth. Sem sessão →
   `401 {"error":"Unauthorized - Please provide valid session cookie or API key in Authorization header"}`.
3. Todas as respostas 401 incluem headers CORS.
4. **Não parseie o corpo do 401** — o contrato é o status code; a mensagem pode
   mudar.
5. A key opera como o usuário de `API_KEY_USER_ID` — as checagens de membership
   de workspace valem para esse usuário. **`API_KEY_USER_ID` é obrigatório**:
   sem ele configurado, a key é rejeitada (fail-closed).

---

## Configuração (.env do servidor)

```env
API_KEY="<hex de 64 chars — gere com o comando abaixo>"
API_KEY_USER_ID="<id do usuário que a key representa>"
```

Gerar nova key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

A validação usa hash SHA-256 com comparação em tempo constante. A trava de
arquitetura (`__tests__/unit/api-architecture.test.ts`) garante que toda rota
nova use o wrapper `withAuth` — auth inline de sessão quebra o CI.

> Nota histórica: o endpoint `/api/generate-token` e o fluxo de token de sessão
> de 30 dias foram **removidos** — com a API key valendo para toda a API, não
> há mais razão para gerar cookies de sessão fora do navegador.
