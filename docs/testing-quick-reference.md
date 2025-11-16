# 🧪 Testing Quick Reference

Guia rápido de comandos e padrões de teste para o projeto WB Project Manager.

---

## 📦 Comandos Disponíveis

### Executar Testes

```bash
# Todos os testes (modo watch)
npm test

# Todos os testes (executar uma vez)
npm test -- --run

# Interface visual
npm run test:ui

# Com coverage
npm run test:coverage

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Apenas testes de API
npm run test:api
```

### Executar Testes Específicos

```bash
# Arquivo específico
npm test __tests__/unit/business-hours.test.ts

# Teste específico (por nome)
npm test -- -t "calcula horas dentro do mesmo dia"

# Arquivo em modo watch
npm test __tests__/unit/business-hours.test.ts -- --watch
```

### Coverage

```bash
# Coverage completo
npm run test:coverage

# Coverage de arquivo específico
npm test __tests__/unit/business-hours.test.ts -- --coverage

# Abrir relatório HTML
open coverage/index.html
```

---

## 🧩 Padrões de Teste

### Estrutura Básica

```typescript
import { describe, test, expect } from 'vitest';
import { functionToTest } from '@/lib/module';

describe('Feature Name', () => {
  describe('Subcategory', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking

#### Mock de Função

```typescript
import { vi } from 'vitest';

const mockFunction = vi.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockResolvedValue(Promise.resolve('value'));

expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg');
```

#### Mock de Módulo

```typescript
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Depois usar
import { prisma } from '@/lib/prisma';
vi.mocked(prisma.user.findUnique).mockResolvedValue({...});
```

#### Mock de NextAuth

```typescript
import { auth } from '@/lib/auth';

vi.mocked(auth).mockResolvedValue({
  user: { id: 'user-123', email: 'user@example.com' },
  expires: new Date().toISOString(),
});
```

### Testando APIs (NextRequest/NextResponse)

```typescript
import { NextRequest, NextResponse } from 'next/server';

test('API endpoint returns 200', async () => {
  const request = new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'test' }),
  });

  const response = await handler(request);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toEqual({ success: true });
});
```

### Testando Dates

```typescript
test('calcula data corretamente', () => {
  const date = new Date('2024-01-15T09:00:00');
  const result = addDays(date, 5);

  expect(result.getDate()).toBe(20);
  expect(result.getMonth()).toBe(0); // Janeiro = 0
  expect(result.getFullYear()).toBe(2024);
});
```

### Testando Validação (Zod)

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
});

test('valida objeto válido', () => {
  const result = schema.safeParse({ name: 'John', age: 30 });
  expect(result.success).toBe(true);
});

test('rejeita objeto inválido', () => {
  const result = schema.safeParse({ name: '', age: -1 });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toHaveLength(2);
  }
});
```

---

## 🎯 Expects Úteis

### Valores

```typescript
expect(value).toBe(expected);              // Igualdade estrita (===)
expect(value).toEqual(expected);           // Igualdade profunda
expect(value).toBeTruthy();                // Truthy
expect(value).toBeFalsy();                 // Falsy
expect(value).toBeNull();                  // null
expect(value).toBeUndefined();             // undefined
expect(value).toBeDefined();               // não undefined
```

### Números

```typescript
expect(value).toBeGreaterThan(5);
expect(value).toBeGreaterThanOrEqual(5);
expect(value).toBeLessThan(10);
expect(value).toBeLessThanOrEqual(10);
expect(value).toBeCloseTo(0.3, 5);        // Precisão de floats
```

### Strings

```typescript
expect(string).toContain('substring');
expect(string).toMatch(/regex/);
expect(string).toHaveLength(10);
```

### Arrays

```typescript
expect(array).toHaveLength(5);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });
```

### Objetos

```typescript
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
expect(obj).toMatchObject({ key: 'value' });
```

### Funções

```typescript
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
expect(fn).toHaveBeenLastCalledWith('arg');
```

### Promises

```typescript
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('error');
```

### Erros

```typescript
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrow(/regex/);
```

---

## 🔧 Configuração

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,                    // Habilita describe, test, expect globais
    environment: 'happy-dom',         // DOM simulation
    setupFiles: ['./vitest.setup.ts'], // Setup global
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### vitest.setup.ts

```typescript
import { beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  // Setup antes de cada teste
});

afterEach(() => {
  // Cleanup após cada teste
  vi.clearAllMocks();
});
```

---

## 🐛 Debug

### Console.log em Testes

```typescript
test('debug test', () => {
  const value = someFunction();
  console.log('Debug:', value); // Aparece no terminal
  expect(value).toBeDefined();
});
```

### Inspect de Objetos

```typescript
import { inspect } from 'util';

console.log(inspect(object, { depth: null, colors: true }));
```

### Breakpoints (VS Code)

1. Adicionar breakpoint no código
2. Executar: "Debug: JavaScript Debug Terminal"
3. Rodar: `npm test`

---

## 📊 Coverage

### Interpretar Relatório

```
% Stmts  = Statement coverage (linhas executadas)
% Branch = Branch coverage (if/else, switch)
% Funcs  = Function coverage (funções chamadas)
% Lines  = Line coverage (linhas de código)
```

### Metas

- **lib/**: >90% coverage (funções críticas)
- **app/api/**: >80% coverage (endpoints)
- **Global**: >85% coverage

---

## 🚨 Troubleshooting

### Testes não encontrados

```bash
# Verificar se padrão está correto
npm test -- --run --reporter=verbose
```

### Mocks não funcionam

```typescript
// Garantir que mock vem ANTES do import
vi.mock('@/lib/module');
import { function } from '@/lib/module';
```

### Coverage não inclui arquivo

Verificar `vitest.config.ts`:
```typescript
coverage: {
  include: ['src/lib/**', 'src/app/api/**'],
  exclude: ['node_modules/', '__tests__/'],
}
```

### Timeout em testes

```typescript
test('slow test', async () => {
  // ...
}, 10000); // 10 segundos
```

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Expect API](https://vitest.dev/api/expect.html)

---

**Última atualização:** 16/11/2025
