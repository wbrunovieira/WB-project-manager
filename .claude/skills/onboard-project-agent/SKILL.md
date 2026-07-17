---
name: onboard-project-agent
description: Gera a mensagem de onboarding para o Claude de OUTRO projeto aprender a gerenciar seu board no WB Project Manager via API (auth por API key, link da doc /api/docs, criar milestones e issues, skill track-work, regra no CLAUDE.md, e migrar plano existente). Use quando o Bruno mandar um link de projeto em produção (https://projects.wbdigitalsolutions.com/projects/<id>) e pedir para "ensinar o claude a gerenciar", "onboard", "mensagem para o claude desse projeto", "similar aos anteriores".
---

# onboard-project-agent — briefing padrão para o Claude de um projeto

Quando o Bruno manda o link de um projeto em produção e pede para ensinar o
Claude daquele projeto a gerenciá-lo, produza **a mensagem de onboarding no chat**
(ele copia e entrega ao outro Claude). Este é o procedimento e o template fixo,
para sair idêntico aos anteriores (WB Projects, WB CRM, chatbot-wb).

## Passo 1 — extrair o projectId e buscar o projeto real

O link é `https://projects.wbdigitalsolutions.com/projects/<projectId>`. Sempre
busque o projeto pela API (nunca invente nome/IDs):

```bash
KEY=$(cat ~/.wb-project-manager-api-key)   # alias: ~/.wb_pm_key
BASE=https://projects.wbdigitalsolutions.com
PID=<projectId>
curl -s -H "Authorization: Bearer $KEY" "$BASE/api/projects/$PID" | python3 -c "
import sys,json;d=json.load(sys.stdin)
print('nome:',d.get('name'));print('workspaceId:',d.get('workspaceId'))
iss=d.get('issues',[]);print('num issues:',len(iss))
seen={i['status']['id']:i['status']['name']+'/'+i['status']['type'] for i in iss if i.get('status')}
print('statuses vistos:',json.dumps(seen,ensure_ascii=False))
"
```

## Passo 2 — resolver os status IDs (são por workspace)

- Se `workspaceId == cmge96f200001wa7ouziczg0w` (**WB Digital Solutions**), use a
  tabela padrão abaixo — vale para todos os projetos desse workspace.
- Se for outro workspace: pegue os status daquele workspace lendo issues existentes
  (`GET /api/issues?workspaceId=<ws>` e leia os objetos `status`). Não há rota
  `/api/statuses`. Se o board estiver vazio e o workspace for desconhecido, peça
  ao Bruno um projeto de referência daquele workspace (ou o mapa de status).

**Tabela padrão (workspace WB Digital `cmge96f200001wa7ouziczg0w`):**

| Status | statusId | type |
|---|---|---|
| Backlog | `cmge9i3pt0005walququqw1rx` | BACKLOG |
| Todo | `cmge9i3pv0007walqv7is970v` | TODO |
| In Progress | `cmge9i3pv0009walqbwhmule6` | IN_PROGRESS |
| Done | `cmge9i3pw000bwalqn1glwrn4` | DONE |
| Canceled | `cmge9i3pw000dwalqi5qgpguo` | CANCELED |

## Passo 3 — montar a mensagem com o template

Preencha `<NOME>`, `<PROJECT_ID>`, `<WORKSPACE_ID>` e a tabela de status. Inclua
a seção de migração de plano **apenas se** o Bruno disser que aquele Claude já
segue um documento de plano. Se o board já tiver issues, avise para listar antes
(evitar duplicar). Se estiver vazio, é migração limpa.

Seções fixas da mensagem (nesta ordem):
1. **Autenticação** — API key no header `Authorization: Bearer <key>`. O antigo
   `/api/generate-token` foi REMOVIDO (não há geração de token de sessão). Obter
   a key com o Bruno, guardar fora do repo (`~/.wb-project-manager-api-key`, 600),
   nunca commitar. Key nova = tarefa de admin: `openssl rand -hex 32` → setar
   `API_KEY` + `API_KEY_USER_ID` (obrigatório) no servidor → redeploy. Não parsear
   o corpo do 401.
2. **Documentação** — Swagger UI em **https://projects.wbdigitalsolutions.com/api/docs**
   (Authorize 🔓 → cola a key → Try it out). Spec: `openapi.yaml` / `/api/openapi`.
   Guia: `scripts/API-KEY-AUTH.md`.
3. **IDs do projeto** — projectId, workspaceId, tabela de status, enums
   (priority: URGENT|HIGH|MEDIUM|LOW|NO_PRIORITY; type: FEATURE|MAINTENANCE|BUG|IMPROVEMENT).
4. **Criar a skill `track-work` no repo DELE** — entregue o conteúdo de
   `.claude/skills/track-work/SKILL.md` parametrizado com o projectId dele, e a
   regra no CLAUDE.md dele (ver o modelo em `.claude/skills/track-work/SKILL.md`
   deste repo — é a base; troque o projectId).
5. **Criar milestones e issues** — `POST /api/milestones` ({name, projectId, targetDate?});
   `POST /api/issues` ou `POST /api/issues/bulk` (até 100). PATCH statusId muda
   status e dispara o SLA automático.
6. **(Se aplicável) Migrar o plano** — ler o documento de plano, criar milestones
   por fase/tema e uma issue por ação, com status refletindo o estado real; a
   partir daí o board vira a fonte da verdade.
7. **Gotchas** — GET filtra por `status=<TYPE>`; POST/PATCH usam `statusId=<cuid>`.
   Datas ISO 8601. `milestoneId`/`assigneeId` aceitam null. Bulk máx 100. A UI não
   auto-atualiza (dar refresh).

## Regras
- Sempre buscar o projeto pela API antes de escrever (nome e IDs reais).
- Nunca colocar a API key real na mensagem — use `<key>`/placeholder e mande obter com o Bruno.
- A mensagem sai no chat ("por aqui"); ofereça salvar como `scripts/AGENT-BRIEFING-<nome>.md` ou disparar um subagente para popular o board, se o Bruno quiser.
- Exemplos reais já entregues: WB Projects, WB CRM, chatbot-wb (mesmo workspace WB Digital).
