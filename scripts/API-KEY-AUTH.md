# 🔐 Autenticação API - Bearer Token

## ✅ Solução Implementada

A API agora suporta autenticação via **API Key** usando Bearer Token, facilitando integrações com aplicações externas.

---

## 🔑 API Key

```
7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6
```

---

## 📝 Como Usar

### Header de Autenticação

```
Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6
```

### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
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

### Exemplo JavaScript/TypeScript

```typescript
const API_KEY = "7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6";

const response = await fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
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

### Exemplo Python

```python
import requests

API_KEY = "7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6"

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {API_KEY}'
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

---

## 🎯 Métodos de Autenticação Suportados

A API agora aceita **duas formas** de autenticação:

### 1. API Key (Recomendado para integrações)
```
Authorization: Bearer <api-key>
```

### 2. Session Cookie (Para navegador)
```
Cookie: next-auth.session-token=<token>
```

---

## 🔧 Configuração (para outros ambientes)

### Variáveis de Ambiente (.env)

```env
# API Key para autenticação externa
API_KEY="7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6"
API_KEY_USER_ID="cmge96f1y0000wa7olxm69prv"
```

### Gerar Nova API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📋 IDs de Referência

### Workspace
- ID: `cmge96f200001wa7ouziczg0w`
- Nome: WB Digital Solutions

### Projeto
- ID: `cmgfjhyh50005waqglsynsz1d`
- Nome: Features Zoom link unico...
- URL: http://localhost:3000/projects/cmgfjhyh50005waqglsynsz1d

### Milestones
- Sprint 1: `cmggc1uqk0001wakb3no9xhb7`
- Sprint 2: `cmggc2ctf0003wakbo6jvl6lm`

### Statuses
- Backlog: `cmge9i3pt0005walququqw1rx`
- Todo: `cmge9i3pv0007walqv7is970v`
- In Progress: `cmge9i3pv0009walqbwhmule6`
- Done: `cmge9i3pw000bwalqn1glwrn4`
- Canceled: `cmge9i3pw000dwalqi5qgpguo`

### Labels
- Backend: `cmgf23zl50009watfyq73olpr`
- Frontend: `cmgf21xvb0003watfaqi1ynw7`
- bug: `cmgfcyxlz0003waknba486r40`
- geral: `cmggcqqz30005wakbtez2z061`

### Usuário
- Bruno Vieira: `cmge96f1y0000wa7olxm69prv`

---

## ✅ Teste Rápido

```bash
# Criar issue de teste
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d '{"title":"Test","workspaceId":"cmge96f200001wa7ouziczg0w","statusId":"cmge9i3pv0007walqv7is970v"}'
```

---

## 🔒 Segurança

- A API Key é armazenada como hash SHA-256 em memória
- Nunca exponha a API Key em repositórios públicos
- Use HTTPS em produção
- Considere rotacionar a chave periodicamente

---

## 📚 Referências

- Código implementado: `src/lib/api-auth.ts`
- Documentação completa: `scripts/API-INTEGRATION.md`
- CLAUDE.md: Guia do projeto
