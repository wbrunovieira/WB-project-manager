# 🔑 Token de Autenticação - WB Project Manager

## Token de Sessão

```
eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..asJYABPnNz5n6Rt7gFfwTg.5dyUu7DXLOHiMBy6v-ZpDL8NuJLlhjw95BUwOiWQc0P1fePkFyNaBiP3qcwXbfk2tPKzoFdp_5jc7x7RU_nwoURJcRVSOTc4KTIU68efLXrru5_bo8biF7DkB_zpH8lAUIev2a9CNLyCVAyN52i4_pvejBoNUFMJLNU4_Id0NS8lbI6bTdXoXb780vyMT1QSoax8d1prg7loA7fXFYiegYXVROAeJHtAAd3ZwJsK45s.pX9uH7WgmB-f4FfaHDTBc9NpMCaFuY9XtIAuzJADHsU
```

## Como Usar

### No Header Cookie:
```
Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..asJYABPnNz5n6Rt7gFfwTg.5dyUu7DXLOHiMBy6v-ZpDL8NuJLlhjw95BUwOiWQc0P1fePkFyNaBiP3qcwXbfk2tPKzoFdp_5jc7x7RU_nwoURJcRVSOTc4KTIU68efLXrru5_bo8biF7DkB_zpH8lAUIev2a9CNLyCVAyN52i4_pvejBoNUFMJLNU4_Id0NS8lbI6bTdXoXb780vyMT1QSoax8d1prg7loA7fXFYiegYXVROAeJHtAAd3ZwJsK45s.pX9uH7WgmB-f4FfaHDTBc9NpMCaFuY9XtIAuzJADHsU
```

### Exemplo cURL:
```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..asJYABPnNz5n6Rt7gFfwTg.5dyUu7DXLOHiMBy6v-ZpDL8NuJLlhjw95BUwOiWQc0P1fePkFyNaBiP3qcwXbfk2tPKzoFdp_5jc7x7RU_nwoURJcRVSOTc4KTIU68efLXrru5_bo8biF7DkB_zpH8lAUIev2a9CNLyCVAyN52i4_pvejBoNUFMJLNU4_Id0NS8lbI6bTdXoXb780vyMT1QSoax8d1prg7loA7fXFYiegYXVROAeJHtAAd3ZwJsK45s.pX9uH7WgmB-f4FfaHDTBc9NpMCaFuY9XtIAuzJADHsU" \
  -d '{
    "title": "Sua Issue Aqui",
    "description": "Descrição da issue",
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "projectId": "cmgfjhyh50005waqglsynsz1d",
    "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "assigneeId": "cmge96f1y0000wa7olxm69prv",
    "priority": "HIGH",
    "type": "FEATURE",
    "labelIds": ["cmgf23zl50009watfyq73olpr"]
  }'
```

### Exemplo JavaScript/TypeScript:
```typescript
const token = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..asJYABPnNz5n6Rt7gFfwTg.5dyUu7DXLOHiMBy6v-ZpDL8NuJLlhjw95BUwOiWQc0P1fePkFyNaBiP3qcwXbfk2tPKzoFdp_5jc7x7RU_nwoURJcRVSOTc4KTIU68efLXrru5_bo8biF7DkB_zpH8lAUIev2a9CNLyCVAyN52i4_pvejBoNUFMJLNU4_Id0NS8lbI6bTdXoXb780vyMT1QSoax8d1prg7loA7fXFYiegYXVROAeJHtAAd3ZwJsK45s.pX9uH7WgmB-f4FfaHDTBc9NpMCaFuY9XtIAuzJADHsU";

const response = await fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${token}`
  },
  body: JSON.stringify({
    title: "Sua Issue Aqui",
    description: "Descrição da issue",
    workspaceId: "cmge96f200001wa7ouziczg0w",
    projectId: "cmgfjhyh50005waqglsynsz1d",
    milestoneId: "cmggc1uqk0001wakb3no9xhb7",
    statusId: "cmge9i3pv0007walqv7is970v",
    assigneeId: "cmge96f1y0000wa7olxm69prv",
    priority: "HIGH",
    type: "FEATURE",
    labelIds: ["cmgf23zl50009watfyq73olpr"]
  })
});

const issue = await response.json();
console.log('Issue criada:', issue);
```

### Exemplo Python:
```python
import requests

token = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..asJYABPnNz5n6Rt7gFfwTg.5dyUu7DXLOHiMBy6v-ZpDL8NuJLlhjw95BUwOiWQc0P1fePkFyNaBiP3qcwXbfk2tPKzoFdp_5jc7x7RU_nwoURJcRVSOTc4KTIU68efLXrru5_bo8biF7DkB_zpH8lAUIev2a9CNLyCVAyN52i4_pvejBoNUFMJLNU4_Id0NS8lbI6bTdXoXb780vyMT1QSoax8d1prg7loA7fXFYiegYXVROAeJHtAAd3ZwJsK45s.pX9uH7WgmB-f4FfaHDTBc9NpMCaFuY9XtIAuzJADHsU"

headers = {
    'Content-Type': 'application/json',
    'Cookie': f'next-auth.session-token={token}'
}

data = {
    "title": "Sua Issue Aqui",
    "description": "Descrição da issue",
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "projectId": "cmgfjhyh50005waqglsynsz1d",
    "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "assigneeId": "cmge96f1y0000wa7olxm69prv",
    "priority": "HIGH",
    "type": "FEATURE",
    "labelIds": ["cmgf23zl50009watfyq73olpr"]
}

response = requests.post('http://localhost:3000/api/issues', headers=headers, json=data)
issue = response.json()
print('Issue criada:', issue)
```

## ⏰ Validade

Este token é válido por **30 dias** a partir da geração.

## 🔄 Gerar Novo Token

Se o token expirar, gere um novo através do endpoint:

```bash
curl -X POST http://localhost:3000/api/generate-token \
  -H "Content-Type: application/json" \
  -d '{"email":"bruno@wbdigitalsolutions.com","password":"Projects172003"}'
```

## 📋 IDs de Referência

Veja todos os IDs necessários no arquivo: `scripts/API-INTEGRATION.md`
