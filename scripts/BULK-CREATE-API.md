# 📦 API - Criação em Lote de Issues

## 🎯 Endpoint

```
POST http://localhost:3000/api/issues/bulk
```

Cria múltiplas issues em uma única requisição, ideal para importações e integrações automatizadas.

---

## 🔐 Autenticação

```
Authorization: Bearer $API_KEY
```

---

## 📝 Request Body

### Estrutura

```typescript
{
  workspaceId: string;      // ID do workspace (obrigatório)
  issues: Issue[];          // Array de 1 a 100 issues (obrigatório)
}
```

### Issue Object

```typescript
{
  title: string;                    // Obrigatório
  description?: string;             // Opcional
  statusId: string;                 // Obrigatório
  projectId?: string;               // Opcional
  milestoneId?: string;             // Opcional
  assigneeId?: string;              // Opcional
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NO_PRIORITY";
  type?: "FEATURE" | "MAINTENANCE" | "BUG" | "IMPROVEMENT";  // Default: "FEATURE"
  reportedAt?: string;              // ISO 8601 date, opcional
  labelIds?: string[];              // Array de IDs de labels, opcional
}
```

---

## 📋 Exemplo Completo

```bash
curl -X POST http://localhost:3000/api/issues/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "issues": [
      {
        "title": "Implementar autenticação JWT",
        "description": "Adicionar suporte para tokens JWT na API",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
        "assigneeId": "cmge96f1y0000wa7olxm69prv",
        "priority": "HIGH",
        "type": "FEATURE",
        "labelIds": ["cmgf23zl50009watfyq73olpr"]
      },
      {
        "title": "Corrigir bug no login",
        "description": "Usuário não consegue fazer login com senha especial",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "URGENT",
        "type": "BUG",
        "labelIds": ["cmgfcyxlz0003waknba486r40"]
      },
      {
        "title": "Melhorar performance do dashboard",
        "description": "Dashboard está lento com muitos projetos",
        "statusId": "cmge9i3pt0005walququqw1rx",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "MEDIUM",
        "type": "IMPROVEMENT",
        "labelIds": ["cmgf21xvb0003watfaqi1ynw7"]
      }
    ]
  }'
```

---

## ✅ Response de Sucesso (201 Created)

```json
{
  "success": true,
  "count": 3,
  "issues": [
    {
      "id": "cmgggyi6d000jwa4ctrxv1spx",
      "identifier": "8",
      "title": "Implementar autenticação JWT",
      "description": "Adicionar suporte para tokens JWT na API",
      "type": "FEATURE",
      "priority": "HIGH",
      "statusId": "cmge9i3pv0007walqv7is970v",
      "workspaceId": "cmge96f200001wa7ouziczg0w",
      "projectId": "cmgfjhyh50005waqglsynsz1d",
      "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
      "creatorId": "cmge96f1y0000wa7olxm69prv",
      "assigneeId": "cmge96f1y0000wa7olxm69prv",
      "createdAt": "2025-10-07T11:21:10.021Z",
      "status": { ... },
      "project": { ... },
      "assignee": { ... },
      "creator": { ... },
      "labels": [ ... ]
    },
    // ... mais issues
  ]
}
```

---

## 💡 Exemplo JavaScript/TypeScript

```typescript
const API_KEY = "$API_KEY";

async function createBulkIssues(issues) {
  const response = await fetch('http://localhost:3000/api/issues/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      workspaceId: "cmge96f200001wa7ouziczg0w",
      issues: issues
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`✅ ${result.count} issues criadas com sucesso!`);
    return result.issues;
  } else {
    console.error('❌ Erro:', result.error);
    throw new Error(result.error);
  }
}

// Exemplo de uso
const myIssues = [
  {
    title: "Issue 1",
    description: "Descrição da issue 1",
    statusId: "cmge9i3pv0007walqv7is970v",
    projectId: "cmgfjhyh50005waqglsynsz1d",
    priority: "HIGH",
    type: "FEATURE"
  },
  {
    title: "Issue 2",
    description: "Descrição da issue 2",
    statusId: "cmge9i3pv0007walqv7is970v",
    projectId: "cmgfjhyh50005waqglsynsz1d",
    priority: "MEDIUM",
    type: "BUG"
  }
];

createBulkIssues(myIssues)
  .then(issues => console.log('Issues criadas:', issues))
  .catch(error => console.error('Erro:', error));
```

---

## 🐍 Exemplo Python

```python
import requests

API_KEY = "$API_KEY"
API_URL = "http://localhost:3000/api/issues/bulk"

def create_bulk_issues(issues):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }

    payload = {
        "workspaceId": "cmge96f200001wa7ouziczg0w",
        "issues": issues
    }

    response = requests.post(API_URL, headers=headers, json=payload)
    result = response.json()

    if result.get('success'):
        print(f"✅ {result['count']} issues criadas com sucesso!")
        return result['issues']
    else:
        print(f"❌ Erro: {result.get('error')}")
        raise Exception(result.get('error'))

# Exemplo de uso
my_issues = [
    {
        "title": "Issue 1",
        "description": "Descrição da issue 1",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "HIGH",
        "type": "FEATURE"
    },
    {
        "title": "Issue 2",
        "description": "Descrição da issue 2",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "MEDIUM",
        "type": "BUG"
    }
]

try:
    issues = create_bulk_issues(my_issues)
    print(f"Issues criadas: {len(issues)}")
except Exception as e:
    print(f"Erro ao criar issues: {e}")
```

---

## ⚙️ Características

### ✅ Vantagens

- **Transacional**: Todas as issues são criadas em uma única transação do banco
- **Atomicidade**: Se uma falhar, todas falham (rollback automático)
- **Performance**: Muito mais rápido que criar uma por uma
- **Identifiers sequenciais**: IDs são gerados em sequência automática
- **Validação individual**: Cada issue é validada antes da criação

### 📊 Limites

- **Mínimo**: 1 issue por requisição
- **Máximo**: 100 issues por requisição
- **Timeout**: 20 segundos para requisições grandes

---

## ❌ Erros Comuns

### 400 - Validação Falhou

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["issues", 0, "title"],
      "message": "Title is required"
    }
  ]
}
```

**Causa**: Dados inválidos em uma ou mais issues

### 401 - Não Autorizado

```json
{
  "error": "Unauthorized - Please provide valid session cookie or API key in Authorization header"
}
```

**Causa**: API Key inválida ou ausente

### 403 - Acesso Negado

```json
{
  "error": "Access denied to workspace"
}
```

**Causa**: Usuário não tem acesso ao workspace especificado

### 400 - Limites Excedidos

```json
{
  "error": "Maximum 100 issues per request"
}
```

**Causa**: Tentou criar mais de 100 issues de uma vez

---

## 📋 IDs de Referência

### Workspace
```
cmge96f200001wa7ouziczg0w - WB Digital Solutions
```

### Projeto
```
cmgfjhyh50005waqglsynsz1d - Features Zoom link unico...
```

### Milestones
```
cmggc1uqk0001wakb3no9xhb7 - Sprint 1
cmggc2ctf0003wakbo6jvl6lm - Sprint 2
```

### Statuses
```
cmge9i3pt0005walququqw1rx - Backlog
cmge9i3pv0007walqv7is970v - Todo
cmge9i3pv0009walqbwhmule6 - In Progress
cmge9i3pw000bwalqn1glwrn4 - Done
cmge9i3pw000dwalqi5qgpguo - Canceled
```

### Labels
```
cmgf23zl50009watfyq73olpr - Backend
cmgf21xvb0003watfaqi1ynw7 - Frontend
cmgfcyxlz0003waknba486r40 - bug
cmggcqqz30005wakbtez2z061 - geral
```

### Usuário
```
cmge96f1y0000wa7olxm69prv - Bruno Vieira
```

---

## 🔗 Referências

- **API Key Auth**: `scripts/API-KEY-AUTH.md`
- **API Individual**: `scripts/API-INTEGRATION.md`
- **Código**: `src/app/api/issues/bulk/route.ts`
- **Teste**: `scripts/test-bulk-create.sh`
