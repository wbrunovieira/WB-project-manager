# Resposta para o Time - Configuração CORS

## ✅ Problema Identificado e Corrigido!

O erro "Failed to fetch" estava acontecendo porque a configuração CORS não estava completa para suportar cookies cross-origin.

### O que foi corrigido:

1. ✅ **CORS configurado para aceitar requisições de `http://localhost:3001`**
2. ✅ **Header `Access-Control-Allow-Credentials: true` adicionado**
3. ✅ **Header `Cookie` adicionado à lista de headers permitidos**

---

## 🔧 Configuração Necessária

**1. Adicione esta variável no arquivo `.env` do projeto da API:**

```bash
ALLOWED_ORIGIN="http://localhost:3001"
```

**2. Reinicie o servidor Next.js após adicionar a variável**

---

## ✅ Como Fazer as Requisições (Forma Correta)

### 1. Listar Projetos (GET)

```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',  // ✅ Isso envia os cookies automaticamente
});

const projects = await response.json();
```

### 2. Criar Projeto de Desenvolvimento (POST)

```typescript
const response = await fetch('http://localhost:3000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // ✅ Isso envia os cookies automaticamente
  body: JSON.stringify({
    name: "Nome do Projeto",
    description: "Descrição",
    workspaceId: "cm123abc456",
    type: "DEVELOPMENT",
    status: "IN_PROGRESS",
    startDate: "2024-01-15",
    targetDate: "2024-06-30"
  })
});

const project = await response.json();
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
    name: "Manutenção Cliente X",
    description: "Contrato mensal de manutenção",
    workspaceId: "cm123abc456",
    type: "MAINTENANCE",  // ✅ Para projetos de manutenção com SLA
    status: "IN_PROGRESS"
  })
});

const project = await response.json();
```

---

## 🎯 Respostas às suas perguntas:

### 1. CORS está configurado?
✅ **Sim!** Agora está configurado para aceitar requisições de `http://localhost:3001`

### 2. Cookies cross-origin funcionam entre portas diferentes?
✅ **Sim!** `localhost:3000` e `localhost:3001` são considerados "same-site" pelo navegador. Os cookies funcionam perfeitamente com `credentials: 'include'`

### 3. Preciso enviar algum header adicional?
❌ **Não!** Apenas use `credentials: 'include'` e o navegador envia os cookies automaticamente. Não precisa copiar/colar cookies manualmente.

### 4. O Content-Type é permitido?
✅ **Sim!** O header `Content-Type: application/json` está na lista de headers permitidos.

---

## 🧪 Como Testar se Está Funcionando

### Teste 1: Verificar se a API está respondendo

```bash
curl http://localhost:3000/api/projects
```

**Resposta esperada:**
```json
{
  "error": "Unauthorized"
}
```

Isso é **normal**! Significa que a API está funcionando e pedindo autenticação.

### Teste 2: Verificar CORS Preflight

```bash
curl -X OPTIONS http://localhost:3000/api/projects \
  -H "Origin: http://localhost:3001" \
  -v
```

**Você deve ver estes headers na resposta:**
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Cookie
```

---

## ⚠️ Possível Problema: Erro 401 Unauthorized

Se você receber erro 401, significa que o cookie de sessão não está sendo enviado ou é inválido.

**Soluções:**

### Opção A: O usuário já está logado em `localhost:3000`

Se o usuário já fez login no sistema principal, os cookies já existem. Use apenas:

```typescript
credentials: 'include'  // Isso é suficiente!
```

### Opção B: Fazer login programaticamente

Se você não tem acesso à sessão existente, faça login primeiro:

```typescript
// 1. Fazer login
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// 2. Agora pode usar a API
const projects = await fetch('http://localhost:3000/api/projects', {
  method: 'GET',
  credentials: 'include',
});
```

---

## 📚 Documentação Completa

Toda a documentação está em:
- `/docs/api/projects.md` - Documentação completa da API
- `/docs/api/integration-guide.md` - Guia detalhado de integração com troubleshooting

---

## ✅ Checklist Rápido

1. ✅ Adicionar `ALLOWED_ORIGIN="http://localhost:3001"` no `.env`
2. ✅ Reiniciar o servidor
3. ✅ Usar `credentials: 'include'` em todas as requisições
4. ✅ Garantir que o usuário está autenticado
5. ✅ Testar!

---

## 🚀 Está Pronto!

Com essas mudanças, suas requisições devem funcionar perfeitamente. Se ainda tiver algum problema:

1. Confirme que a variável `ALLOWED_ORIGIN` está no `.env`
2. Confirme que reiniciou o servidor
3. Verifique os logs do servidor Next.js
4. Use o DevTools (aba Network) para ver os headers das requisições

Qualquer dúvida, consulte o guia completo em `/docs/api/integration-guide.md`

Bom desenvolvimento! 🎉
