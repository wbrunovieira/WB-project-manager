---
name: track-work
description: Rastreia todo trabalho neste repo (melhorias, correções, features, débito técnico) como issues no projeto "WB Projects" via a própria API do app, e mantém o status delas atualizado. Use SEMPRE que for planejar ou iniciar trabalho não-trivial, ao descobrir um bug/melhoria, ao começar uma tarefa (→ In Progress) e ao concluí-la (→ Done). Também ao pedir "cria as issues", "atualiza o board", "registra isso no projeto".
---

# track-work — rastrear trabalho como issues no WB Projects

Este projeto se auto-gerencia: **toda melhoria ou correção vira uma issue** no
projeto de tracking "WB Projects", e o status é mantido em dia conforme o
trabalho anda. Isto é dogfooding — o app rastreia o próprio desenvolvimento.

## Quando usar (gatilhos)

- Ao **planejar** trabalho não-trivial → crie uma issue por ação antes de começar.
- Ao **descobrir** um bug, débito técnico ou melhoria (ex.: achado de code-review) → crie a issue na hora.
- Ao **iniciar** uma tarefa → mova a issue para **In Progress**.
- Ao **concluir** → mova para **Done** (o app calcula o SLA sozinho).
- Ao **abandonar/descartar** → mova para **Canceled**.

Não rastreie trivialidades (typo, ajuste de uma linha sem risco). Rastreie o que
um revisor ou o Bruno gostaria de ver no board.

## Constantes (workspace WB Digital Solutions)

- Base URL: `https://projects.wbdigitalsolutions.com`
- Projeto de tracking: **WB Projects** — `projectId: cmor7mjuc000dpa01z8izh57o`
- `workspaceId: cmge96f200001wa7ouziczg0w`
- API key: `~/.wb-project-manager-api-key` (alias: `~/.wb_pm_key`) — NUNCA ecoar a key no chat/histórico; leia via `$(cat ...)`.

Status IDs:

| Nome | statusId | type |
|---|---|---|
| Backlog | `cmge9i3pt0005walququqw1rx` | BACKLOG |
| Todo | `cmge9i3pv0007walqv7is970v` | TODO |
| In Progress | `cmge9i3pv0009walqbwhmule6` | IN_PROGRESS |
| Done | `cmge9i3pw000bwalqn1glwrn4` | DONE |
| Canceled | `cmge9i3pw000dwalqi5qgpguo` | CANCELED |

`priority`: URGENT | HIGH | MEDIUM | LOW | NO_PRIORITY.
`type`: FEATURE | MAINTENANCE | BUG | IMPROVEMENT.

## Como fazer (a API é a interface — sem UI, sem SQL)

Sempre exporte a key primeiro:

```bash
KEY=$(cat ~/.wb-project-manager-api-key)
BASE=https://projects.wbdigitalsolutions.com
```

### Verificar o que já existe (evite duplicar)

```bash
curl -s -H "Authorization: Bearer $KEY" \
  "$BASE/api/issues?projectId=cmor7mjuc000dpa01z8izh57o" \
  | python3 -c "import sys,json;[print(i['identifier'],i['status']['type'],i['title']) for i in json.load(sys.stdin)]"
```

### Criar uma issue

```bash
curl -s -X POST "$BASE/api/issues" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{
    "title": "Título curto e acionável",
    "description": "Contexto: o quê, por quê, critério de pronto.",
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "projectId": "cmor7mjuc000dpa01z8izh57o",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "type": "IMPROVEMENT",
    "priority": "MEDIUM"
  }'
```

### Criar várias de uma vez (planejamento) — até 100

`POST /api/issues/bulk` com `{ "workspaceId": "...", "issues": [ {title, statusId, projectId, type, priority, description}, ... ] }`.

### Mudar status (in progress / done)

Guarde o `id` retornado na criação e faça PATCH — mudar `statusId` dispara os
side effects de SLA automaticamente (firstResponseAt / resolvedAt / reopenCount):

```bash
curl -s -X PATCH "$BASE/api/issues/ISSUE_ID" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"statusId": "cmge9i3pv0009walqbwhmule6"}'   # → In Progress
```

## Regras

- ⚠️ No **GET** o filtro é `status=<TYPE>` (ex.: `status=IN_PROGRESS`); no **POST/PATCH** é `statusId=<cuid>`. São coisas diferentes.
- Não parseie o corpo do 401 — confie no status code.
- Antes de criar, liste as issues do projeto para não duplicar; se já existe, faça PATCH em vez de criar outra.
- Contratos completos de todas as rotas: veja a spec em `/api/docs` (Swagger UI) e `openapi.yaml`, além de `scripts/API-KEY-AUTH.md`.
