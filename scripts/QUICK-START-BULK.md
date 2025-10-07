# 🚀 Quick Start - Criação em Lote de Issues

## 📍 Endpoint

```
POST http://localhost:3000/api/issues/bulk
```

## 🔑 Autenticação

```
Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6
```

## ⚡ Exemplo Rápido (cURL)

```bash
curl -X POST http://localhost:3000/api/issues/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d @scripts/bulk-issues-example.json
```

## 💡 Exemplo JavaScript

```javascript
const API_KEY = "7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6";

const response = await fetch('http://localhost:3000/api/issues/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    workspaceId: "cmge96f200001wa7ouziczg0w",
    issues: [
      {
        title: "Issue 1",
        statusId: "cmge9i3pv0007walqv7is970v",
        projectId: "cmgfjhyh50005waqglsynsz1d",
        priority: "HIGH",
        type: "FEATURE"
      },
      {
        title: "Issue 2",
        statusId: "cmge9i3pv0007walqv7is970v",
        projectId: "cmgfjhyh50005waqglsynsz1d",
        priority: "MEDIUM",
        type: "BUG"
      }
    ]
  })
});

const result = await response.json();
console.log(`✅ ${result.count} issues criadas!`);
```

## 📋 Campos Mínimos Obrigatórios

```json
{
  "workspaceId": "cmge96f200001wa7ouziczg0w",
  "issues": [
    {
      "title": "Título da Issue",
      "statusId": "cmge9i3pv0007walqv7is970v"
    }
  ]
}
```

## 📦 IDs Prontos para Usar

```javascript
// Workspace
const WORKSPACE_ID = "cmge96f200001wa7ouziczg0w";

// Projeto
const PROJECT_ID = "cmgfjhyh50005waqglsynsz1d";

// Milestones
const SPRINT_1 = "cmggc1uqk0001wakb3no9xhb7";
const SPRINT_2 = "cmggc2ctf0003wakbo6jvl6lm";

// Statuses
const STATUS_BACKLOG = "cmge9i3pt0005walququqw1rx";
const STATUS_TODO = "cmge9i3pv0007walqv7is970v";
const STATUS_IN_PROGRESS = "cmge9i3pv0009walqbwhmule6";
const STATUS_DONE = "cmge9i3pw000bwalqn1glwrn4";

// Labels
const LABEL_BACKEND = "cmgf23zl50009watfyq73olpr";
const LABEL_FRONTEND = "cmgf21xvb0003watfaqi1ynw7";
const LABEL_BUG = "cmgfcyxlz0003waknba486r40";

// User
const USER_BRUNO = "cmge96f1y0000wa7olxm69prv";
```

## ✅ Response de Sucesso

```json
{
  "success": true,
  "count": 2,
  "issues": [
    {
      "id": "...",
      "identifier": "11",
      "title": "Issue 1",
      ...
    },
    {
      "id": "...",
      "identifier": "12",
      "title": "Issue 2",
      ...
    }
  ]
}
```

## 📚 Documentação Completa

- **Bulk API**: `scripts/BULK-CREATE-API.md`
- **API Key**: `scripts/API-KEY-AUTH.md`
- **IDs Completos**: `scripts/API-INTEGRATION.md`

## 🎯 Limites

- **Mínimo**: 1 issue
- **Máximo**: 100 issues por requisição
- **Transação**: Tudo ou nada (se uma falhar, todas falham)
