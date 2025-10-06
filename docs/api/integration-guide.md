# Guia de Integração - API de Projects

## Resposta para o Time do Backend/Frontend

Olá! Identifiquei o problema. A configuração CORS estava incompleta para suportar cookies cross-origin. Já foi corrigido!

---

## ✅ Correções Realizadas

### 1. CORS está Configurado Corretamente Agora

**Problema identificado:**
- A API estava enviando `Access-Control-Allow-Origin: *`
- **NÃO** estava enviando `Access-Control-Allow-Credentials: true`
- Quando você usa `credentials: 'include'`, o CORS **não pode** usar `*`, precisa especificar a origem exata

**Solução aplicada:**
```typescript
// src/lib/api-auth.ts
export function withCors(response: NextResponse) {
  const origin = process.env.ALLOWED_ORIGIN || "http://localhost:3001";

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
  return response;
}
```

### 2. Headers Permitidos

Agora a API permite:
- ✅ `Content-Type: application/json`
- ✅ `Authorization`
- ✅ `Cookie`

### 3. Configuração Necessária

**Adicione no arquivo `.env` do projeto:**

```bash
# CORS Configuration
ALLOWED_ORIGIN="http://localhost:3001"
```

Se você tem múltiplas origens em produção, pode ajustar o código para aceitar uma lista.

---

## 📝 Como Fazer as Requisições (Atualizado)

### Pré-requisito: Autenticação

As requisições precisam enviar cookies de sessão. Existem duas formas:

#### Opção 1: Autenticação via Cookie (Recomendado)

Se o usuário já está autenticado no sistema principal em `localhost:3000`, você pode compartilhar a sessão.

**Importante:** Cookies entre diferentes portas (`localhost:3000` e `localhost:3001`) são considerados "same-site" pelo navegador, então funcionam com `credentials: 'include'`.

```typescript
// Todas as requisições devem incluir credentials: 'include'
fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',  // Envia cookies automaticamente
})
```

#### Opção 2: Autenticação Manual (Se não tiver sessão compartilhada)

Se você não tem acesso aos cookies de sessão, precisará:

1. Fazer login primeiro no sistema principal
2. Obter o cookie de sessão
3. Enviar nas requisições subsequentes

**Exemplo de Login (se necessário):**
```typescript
// 1. Fazer login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// 2. Agora as requisições subsequentes terão o cookie automaticamente
const projectsResponse = await fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',
});
```

---

## 🚀 Exemplos de Requisições Atualizadas

### 1. Listar Projetos (GET)

```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',  // IMPORTANTE: Envia cookies
});

if (!response.ok) {
  const error = await response.json();
  console.error('Erro:', error);
  throw new Error(error.error);
}

const projects = await response.json();
console.log('Projetos:', projects);
```

**Filtrar por workspace:**
```typescript
const response = await fetch('http://localhost:3000/api/projects?workspaceId=cm123abc456', {
  method: 'GET',
  credentials: 'include',
});
```

### 2. Criar Projeto de Desenvolvimento (POST)

```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // IMPORTANTE: Envia cookies
  body: JSON.stringify({
    name: "E-commerce Platform",
    description: "Build a new e-commerce platform",
    workspaceId: "cm123abc456",
    type: "DEVELOPMENT",
    status: "IN_PROGRESS",
    startDate: "2024-01-15",
    targetDate: "2024-06-30"
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Erro:', error);
  throw new Error(error.error);
}

const project = await response.json();
console.log('Projeto criado:', project);
```

### 3. Criar Projeto de Manutenção (POST)

```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: "Client X Maintenance",
    description: "Monthly maintenance contract",
    workspaceId: "cm123abc456",
    type: "MAINTENANCE",  // Tipo especial para contratos de manutenção
    status: "IN_PROGRESS"
  })
});

const project = await response.json();
console.log('Projeto de manutenção criado:', project);
```

---

## 🔧 Troubleshooting

### Erro: "Failed to fetch"

**Causa:** A API não está rodando ou CORS não está configurado.

**Solução:**
1. Verifique se a API está rodando em `http://localhost:3000`
2. Verifique se a variável `ALLOWED_ORIGIN` está configurada no `.env`
3. Reinicie o servidor após adicionar a variável

```bash
# Verificar se está rodando
curl http://localhost:3000/api/projects

# Deve retornar erro 401 (Unauthorized) se não estiver autenticado
# Isso prova que a API está respondendo
```

### Erro: 401 Unauthorized

**Causa:** Cookie de sessão não está sendo enviado ou é inválido.

**Solução:**
1. Certifique-se de incluir `credentials: 'include'` em todas as requisições
2. Verifique se o usuário está autenticado no sistema principal
3. Se necessário, faça login primeiro (veja "Opção 2: Autenticação Manual")

### Erro: 403 Access denied to workspace

**Causa:** O usuário não tem acesso ao workspace especificado.

**Solução:**
1. Verifique se o `workspaceId` está correto
2. Confirme que o usuário autenticado é membro desse workspace
3. Liste os workspaces disponíveis primeiro (endpoint `/api/workspaces`)

### CORS Error no Console

**Sintoma:** Erro tipo `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solução:**
1. Verifique se `ALLOWED_ORIGIN="http://localhost:3001"` está no `.env`
2. Reinicie o servidor Next.js após adicionar
3. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

---

## 🧪 Testando a Configuração

### Teste 1: CORS Preflight (OPTIONS)

```bash
curl -X OPTIONS http://localhost:3000/api/projects \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Resposta esperada deve incluir:**
```
< Access-Control-Allow-Origin: http://localhost:3001
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization, Cookie
```

### Teste 2: GET sem autenticação

```bash
curl -X GET http://localhost:3000/api/projects -v
```

**Resposta esperada:**
```json
{
  "error": "Unauthorized"
}
```

Status: `401`

Isso confirma que a API está funcionando e requer autenticação.

### Teste 3: GET com cookie (se tiver)

```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -v
```

**Resposta esperada:**
```json
[
  {
    "id": "...",
    "name": "...",
    // ... array de projetos
  }
]
```

Status: `200`

---

## 📋 Checklist de Integração

- [ ] Adicionar `ALLOWED_ORIGIN="http://localhost:3001"` no `.env`
- [ ] Reiniciar o servidor Next.js
- [ ] Garantir que todas as requisições incluem `credentials: 'include'`
- [ ] Confirmar que o usuário está autenticado (ou fazer login primeiro)
- [ ] Testar requisição OPTIONS (preflight)
- [ ] Testar GET /api/projects
- [ ] Testar POST /api/projects com projeto de desenvolvimento
- [ ] Testar POST /api/projects com projeto de manutenção

---

## 🔒 Notas de Segurança

1. **Cookies são HttpOnly**: Os cookies de sessão são marcados como HttpOnly por segurança. O JavaScript não pode ler o valor, mas são enviados automaticamente com `credentials: 'include'`.

2. **SameSite Policy**: Cookies entre `localhost:3000` e `localhost:3001` funcionam porque são considerados "same-site". Em produção, configure corretamente o domínio.

3. **CORS em Produção**: Em produção, atualize `ALLOWED_ORIGIN` para o domínio do frontend:
   ```bash
   ALLOWED_ORIGIN="https://seu-frontend.com"
   ```

4. **Múltiplas Origens**: Se precisar permitir múltiplas origens, modifique `src/lib/api-auth.ts` para verificar contra uma lista:
   ```typescript
   const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
   const origin = req.headers.get("origin") || "";
   if (allowedOrigins.includes(origin)) {
     response.headers.set("Access-Control-Allow-Origin", origin);
   }
   ```

---

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique os logs do servidor Next.js
2. Use o DevTools do navegador (Network tab) para ver os headers da requisição/resposta
3. Confirme que o endpoint OPTIONS está retornando 204 com os headers corretos
4. Teste com cURL primeiro para isolar problemas de JavaScript/CORS

**Logs úteis para debug:**
```typescript
// No seu código frontend, adicione:
fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',
})
  .then(r => {
    console.log('Status:', r.status);
    console.log('Headers:', [...r.headers.entries()]);
    return r.json();
  })
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));
```

Agora está tudo configurado! 🚀
