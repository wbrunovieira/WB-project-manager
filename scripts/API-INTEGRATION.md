# 🔌 Integração API - WB Project Manager

Guia para outros aplicativos criarem issues no WB Project Manager.

---

## 🎯 Endpoint

```
POST http://localhost:3000/api/issues
```

---

## 🔐 Autenticação

O sistema usa **NextAuth v5** com autenticação baseada em cookies de sessão.

### Opção 1: Cookie de Sessão (Recomendado)

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d @issue-data.json
```

**Como obter o token de sessão:**
1. Abra http://localhost:3000 no navegador
2. Faça login no sistema
3. Abra DevTools (F12)
4. Vá em **Application > Cookies > http://localhost:3000**
5. Copie o valor do cookie `next-auth.session-token`

### Opção 2: CORS para Aplicações Externas

Configure no `.env`:
```env
ALLOWED_ORIGIN="http://localhost:3001"
```

Depois faça requisições do seu frontend com credentials:
```javascript
fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Envia cookies automaticamente
  body: JSON.stringify(issueData)
})
```

---

## 📋 IDs Necessários

### Workspace
```
ID: cmge96f200001wa7ouziczg0w
Nome: WB Digital Solutions
```

### Projeto
```
ID: cmgfjhyh50005waqglsynsz1d
Nome: Features Zoom link unico, pdf protegidos, login unico e flashcard em lotes
URL: http://localhost:3000/projects/cmgfjhyh50005waqglsynsz1d
```

### Milestones
```
Sprint 1: cmggc1uqk0001wakb3no9xhb7
Sprint 2: cmggc2ctf0003wakbo6jvl6lm
```

### Statuses (obrigatório)
```
Backlog:     cmge9i3pt0005walququqw1rx
Todo:        cmge9i3pv0007walqv7is970v
In Progress: cmge9i3pv0009walqbwhmule6
Done:        cmge9i3pw000bwalqn1glwrn4
Canceled:    cmge9i3pw000dwalqi5qgpguo
```

### Labels (opcional)
```
Backend:  cmgf23zl50009watfyq73olpr
Frontend: cmgf21xvb0003watfaqi1ynw7
bug:      cmgfcyxlz0003waknba486r40
geral:    cmggcqqz30005wakbtez2z061
```

### Usuário (assigneeId)
```
Bruno Vieira: cmge96f1y0000wa7olxm69prv
```

---

## 📝 Estrutura da Requisição

### Campos Obrigatórios
```json
{
  "title": "string (mínimo 1 caractere)",
  "workspaceId": "string",
  "statusId": "string"
}
```

### Campos Opcionais
```json
{
  "description": "string (suporta Markdown)",
  "projectId": "string",
  "milestoneId": "string",
  "assigneeId": "string",
  "priority": "URGENT | HIGH | MEDIUM | LOW | NO_PRIORITY",
  "type": "FEATURE | MAINTENANCE | BUG | IMPROVEMENT",
  "reportedAt": "string (ISO 8601 date)",
  "labelIds": ["string", "string"]
}
```

---

## 💡 Exemplo Completo

```json
{
  "title": "Implementar autenticação com Google",
  "description": "## Objetivo\n\nAdicionar login social com Google OAuth\n\n## Tasks\n- [ ] Configurar OAuth app\n- [ ] Implementar provider\n- [ ] Testar fluxo",
  "workspaceId": "cmge96f200001wa7ouziczg0w",
  "projectId": "cmgfjhyh50005waqglsynsz1d",
  "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
  "statusId": "cmge9i3pv0007walqv7is970v",
  "assigneeId": "cmge96f1y0000wa7olxm69prv",
  "priority": "HIGH",
  "type": "FEATURE",
  "reportedAt": "2025-01-07T10:30:00.000Z",
  "labelIds": ["cmgf23zl50009watfyq73olpr", "cmgf21xvb0003watfaqi1ynw7"]
}
```

---

## ✅ Response de Sucesso (201 Created)

```json
{
  "id": "cmgh123abc...",
  "identifier": "125",
  "title": "Implementar autenticação com Google",
  "description": "...",
  "type": "FEATURE",
  "priority": "HIGH",
  "workspaceId": "cmge96f200001wa7ouziczg0w",
  "projectId": "cmgfjhyh50005waqglsynsz1d",
  "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
  "statusId": "cmge9i3pv0007walqv7is970v",
  "assigneeId": "cmge96f1y0000wa7olxm69prv",
  "creatorId": "cmge96f1y0000wa7olxm69prv",
  "sortOrder": 0,
  "reportedAt": "2025-01-07T10:30:00.000Z",
  "firstResponseAt": null,
  "resolvedAt": null,
  "resolutionTimeMinutes": null,
  "reopenCount": 0,
  "createdAt": "2025-01-07T14:25:33.123Z",
  "updatedAt": "2025-01-07T14:25:33.123Z",
  "status": {
    "id": "cmge9i3pv0007walqv7is970v",
    "name": "Todo",
    "type": "TODO",
    "position": 1,
    "color": "#64748b"
  },
  "project": {
    "id": "cmgfjhyh50005waqglsynsz1d",
    "name": "Features Zoom link unico..."
  },
  "assignee": {
    "id": "cmge96f1y0000wa7olxm69prv",
    "name": "Bruno Vieira",
    "email": "bruno@wbdigitalsolutions.com",
    "avatar": null
  },
  "creator": {
    "id": "cmge96f1y0000wa7olxm69prv",
    "name": "Bruno Vieira",
    "email": "bruno@wbdigitalsolutions.com"
  },
  "labels": [
    {
      "label": {
        "id": "cmgf23zl50009watfyq73olpr",
        "name": "Backend",
        "color": "#f59e0b"
      }
    }
  ]
}
```

---

## ❌ Erros Comuns

### 401 Unauthorized
```json
{ "error": "Unauthorized" }
```
**Causa:** Token de sessão ausente ou inválido
**Solução:** Adicione o cookie `next-auth.session-token` válido

### 400 Bad Request
```json
{
  "error": "Title is required",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["title"],
      "message": "Title is required"
    }
  ]
}
```
**Causa:** Validação falhou
**Solução:** Verifique os campos obrigatórios

### 403 Forbidden
```json
{ "error": "Access denied to workspace" }
```
**Causa:** Usuário não tem acesso ao workspace
**Solução:** Verifique se o usuário é membro do workspace

---

## 🛠️ Script de Teste

Criamos um script para facilitar o teste:

```bash
# 1. Obtenha o token do navegador (veja instruções acima)

# 2. Execute o script
./scripts/create-issue-with-auth.sh "seu-token-aqui"
```

---

## 📚 Notas Importantes

1. **Identifier**: Gerado automaticamente (número sequencial no workspace)
2. **CreatorId**: Preenchido automaticamente com o usuário autenticado
3. **Description**: Suporta Markdown para formatação rica
4. **ReportedAt**: Aceita formato ISO 8601 ou datetime-local (`YYYY-MM-DDTHH:mm`)
5. **Labels**: Array de IDs, não objetos completos
6. **SortOrder**: Gerado automaticamente (0 por padrão)

---

## 🔗 Referências

- Código da API: `src/app/api/issues/route.ts`
- Schema Prisma: `prisma/schema.prisma`
- Documentação do projeto: `CLAUDE.md`
