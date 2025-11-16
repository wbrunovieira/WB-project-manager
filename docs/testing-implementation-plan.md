# Planejamento de Implementação de Testes - Vitest

## 📋 Visão Geral

Este documento apresenta o planejamento completo para implementação de testes unitários e E2E usando Vitest no projeto WB Project Manager.

**Estimativa Total:** 156+ casos de teste distribuídos em 13 arquivos de teste

**Status Atual:** 🟢 **Semana 1 Completa** (114 testes implementados e passando)

**Tecnologias:**
- Vitest (framework de testes) ✅ Instalado
- @testing-library/react (testes de componentes) ✅ Instalado
- @testing-library/jest-dom ✅ Instalado
- @vitejs/plugin-react ✅ Instalado
- happy-dom (ambiente de testes) ✅ Instalado
- @vitest/ui (interface visual) ✅ Instalado
- @vitest/coverage-v8 (coverage) ✅ Instalado

---

## 🎯 Estrutura de Testes Proposta

```
__tests__/
├── unit/                           # Testes unitários (funções isoladas)
│   ├── business-hours.test.ts      # 49 testes ✅ IMPLEMENTADO
│   ├── auth.test.ts                # 26 testes ✅ IMPLEMENTADO
│   └── validation.test.ts          # 39 testes ✅ IMPLEMENTADO
│
├── integration/                    # Testes de integração (fluxos completos)
│   ├── issue-workflow.test.ts      # 25+ testes ⏳ PENDENTE
│   ├── sla-calculation.test.ts     # 20+ testes ⏳ PENDENTE
│   ├── time-tracking.test.ts       # 15+ testes ⏳ PENDENTE
│   └── bulk-operations.test.ts     # 10+ testes ⏳ PENDENTE
│
└── api/                            # Testes de API (E2E)
    ├── issues.test.ts              # 20+ testes ⏳ PENDENTE
    ├── projects.test.ts            # 10+ testes ⏳ PENDENTE
    ├── time-entries.test.ts        # 8+ testes ⏳ PENDENTE
    ├── auth.test.ts                # 8+ testes ⏳ PENDENTE
    ├── workspaces.test.ts          # 6+ testes ⏳ PENDENTE
    └── milestones.test.ts          # 6+ testes ⏳ PENDENTE

vitest.config.ts                    # ✅ Configurado
vitest.setup.ts                     # ✅ Criado
.env.test                           # ✅ Criado
```

**Legenda:**
- ✅ Implementado e funcionando
- ⏳ Pendente (planejado para próximas semanas)

---

## 📦 Dependências Necessárias

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
npm install -D @vitejs/plugin-react
npm install -D happy-dom
```

**Status:** ✅ Todas as dependências instaladas (16/11/2025)

---

## 📊 Status de Implementação

### ✅ Semana 1 - COMPLETA (16/11/2025)

**Testes Implementados:** 114/114 passando (100%)

| Arquivo | Testes | Status | Coverage |
|---------|--------|--------|----------|
| `business-hours.test.ts` | 49 | ✅ Completo | 89.88% |
| `auth.test.ts` | 26 | ✅ Completo | 100% |
| `validation.test.ts` | 39 | ✅ Completo | N/A |

**Configuração:**
- ✅ vitest.config.ts configurado
- ✅ vitest.setup.ts com mocks globais
- ✅ .env.test criado
- ✅ Scripts package.json adicionados
- ✅ Estrutura __tests__/ criada

**Coverage Alcançado:**
- `lib/business-hours.ts`: 89.88%
- `lib/api-auth.ts`: 100%
- `lib/` (total): 75.55%

**Documentação:**
- ✅ testing-implementation-plan.md
- ✅ week-1-summary.md
- ✅ testing-quick-reference.md

### ⏳ Semana 2 - PENDENTE

**Objetivo:** Testes de integração + API endpoints
**Testes Planejados:** 65+

| Arquivo | Testes | Status |
|---------|--------|--------|
| `issue-workflow.test.ts` | 25+ | ⏳ Pendente |
| `sla-calculation.test.ts` | 20+ | ⏳ Pendente |
| `issues.test.ts` (API) | 20+ | ⏳ Pendente |

### ⏳ Semana 3 - PENDENTE

**Objetivo:** Mais APIs + Time Tracking
**Testes Planejados:** 45+

### ⏳ Semana 4 - PENDENTE

**Objetivo:** Finalização + CI/CD
**Testes Planejados:** Restantes

---

## ⚙️ Configuração Inicial

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.ts',
        'src/generated/**',
      ],
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### vitest.setup.ts

```typescript
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup após cada teste
afterEach(() => {
  cleanup()
})

// Mock do NextAuth
beforeAll(() => {
  // Setup global mocks
})

afterAll(() => {
  // Cleanup global mocks
})
```

### .env.test

```env
DATABASE_URL="file:./test.db"
AUTH_SECRET="test-secret-key"
NEXTAUTH_URL="http://localhost:3000"
API_KEY="test-api-key"
API_KEY_USER_ID="test-user-id"
```

### package.json (adicionar scripts)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest __tests__/unit",
    "test:integration": "vitest __tests__/integration",
    "test:api": "vitest __tests__/api"
  }
}
```

---

## 🔴 TIER 1: CRÍTICO (Semana 1-2)

### 1. Business Hours Calculation (40+ testes)

**Arquivo:** `__tests__/unit/business-hours.test.ts`

**Áreas de teste:**

```typescript
describe('calculateBusinessHours', () => {
  // Casos básicos (10 testes)
  test('calcula horas dentro do mesmo dia útil')
  test('retorna 0 para horário de fim antes do início')
  test('calcula horas entre dias diferentes')
  test('ignora fins de semana')
  test('calcula através de múltiplos fins de semana')

  // Edge cases (15 testes)
  test('início antes do horário comercial (8:00 AM → 9:00 AM)')
  test('fim após horário comercial (6:00 PM → 7:00 PM)')
  test('início e fim fora do horário comercial')
  test('início no sábado, fim na segunda')
  test('cálculo de sexta 5:00 PM até segunda 10:00 AM')
  test('cálculo através de feriados (se implementado)')

  // Precisão (5 testes)
  test('calcula minutos corretamente (não arredonda)')
  test('múltiplos dias completos (5 dias = 45 horas)')
  test('frações de hora precisas')

  // Performance (5 testes)
  test('cálculo rápido para períodos longos (meses)')
  test('não trava com datas inválidas')

  // Timezone (5 testes)
  test('lida com diferentes timezones corretamente')
  test('mudança de horário de verão (se aplicável)')
})

describe('addBusinessHours', () => {
  // 10 testes similares
  test('adiciona horas dentro do mesmo dia')
  test('adiciona horas pulando fim de semana')
  test('adiciona horas começando fora do horário comercial')
})

describe('checkSLAStatus', () => {
  // 10 testes
  test('retorna "on-time" para <80% do SLA usado')
  test('retorna "at-risk" para ≥80% e <100%')
  test('retorna "overdue" para ≥100%')
  test('calcula percentageUsed corretamente')
})
```

**Prioridade:** 🔴 CRÍTICO - Base para todo o sistema de SLA

---

### 2. Issue SLA Workflow (25+ testes)

**Arquivo:** `__tests__/integration/issue-workflow.test.ts`

```typescript
describe('Issue Status Transitions', () => {
  // firstResponseAt (8 testes)
  test('define firstResponseAt ao mover para IN_PROGRESS pela primeira vez')
  test('não sobrescreve firstResponseAt existente')
  test('não define firstResponseAt em outras transições')

  // resolvedAt (8 testes)
  test('define resolvedAt ao mover para DONE')
  test('calcula resolutionTimeMinutes corretamente')
  test('usa reportedAt se definido, senão createdAt')
  test('limpa resolvedAt ao reabrir issue')

  // reopenCount (5 testes)
  test('incrementa ao mover de DONE para outro status')
  test('não incrementa em outras transições')
  test('preserva contagem correta após múltiplas reaberturas')

  // reportedAt recalculation (4 testes)
  test('recalcula resolutionTimeMinutes ao mudar reportedAt de issue resolvida')
  test('não recalcula para issues não resolvidas')
})
```

**Prioridade:** 🔴 CRÍTICO - Lógica de negócio central

---

### 3. API Authentication (20+ testes)

**Arquivo:** `__tests__/unit/auth.test.ts`

```typescript
describe('withAuth wrapper', () => {
  // API Key auth (8 testes)
  test('aceita API key válida')
  test('rejeita API key inválida')
  test('usa SHA-256 para comparação')
  test('usa userId correto do env')

  // Session auth (6 testes)
  test('aceita sessão válida')
  test('rejeita sessão inválida/expirada')
  test('extrai userId da sessão')

  // Fallback (3 testes)
  test('tenta API key primeiro, depois sessão')
  test('retorna 401 se ambos falharem')

  // Workspace access (3 testes)
  test('verifica membership em workspace')
  test('bloqueia acesso a workspace não autorizado')
})
```

**Prioridade:** 🔴 CRÍTICO - Segurança da aplicação

---

## 🟠 TIER 2: ALTO (Semana 2-3)

### 4. Time Tracking System (15+ testes)

**Arquivo:** `__tests__/integration/time-tracking.test.ts`

```typescript
describe('Time Entry Management', () => {
  // Start timer (5 testes)
  test('cria time entry ativo')
  test('permite múltiplos timers simultâneos')
  test('valida que issue existe')

  // Stop timer (5 testes)
  test('para timer e calcula duração total')
  test('inclui elapsed time no cálculo')
  test('não permite parar timer já parado')

  // Elapsed time calculation (5 testes)
  test('calcula elapsed time corretamente')
  test('atualiza em tempo real no context')
  test('persiste duração ao parar')
})
```

---

### 5. Issue API Endpoints (20+ testes)

**Arquivo:** `__tests__/api/issues.test.ts`

```typescript
describe('POST /api/issues', () => {
  // Criação básica (8 testes)
  test('cria issue com campos obrigatórios')
  test('gera identifier sequencial único')
  test('valida campos obrigatórios')
  test('associa labels corretamente')

  // Validação (6 testes)
  test('rejeita priority inválida')
  test('rejeita type inválido')
  test('rejeita statusId inexistente')

  // Authorization (6 testes)
  test('requer autenticação')
  test('verifica acesso ao workspace')
})

describe('PATCH /api/issues/:id', () => {
  // Similar, 15+ testes
})

describe('POST /api/issues/bulk', () => {
  // Bulk operations (12+ testes)
  test('cria múltiplas issues em transação')
  test('rollback se uma falhar')
  test('respeita limite de 100 issues')
  test('gera identifiers sequenciais corretos')
})
```

---

### 6. Bulk Operations (10+ testes)

**Arquivo:** `__tests__/integration/bulk-operations.test.ts`

```typescript
describe('Bulk Issue Creation', () => {
  // Atomicidade (5 testes)
  test('sucesso: todas as issues criadas')
  test('falha: nenhuma issue criada (rollback)')
  test('valida todas antes de criar')

  // Performance (3 testes)
  test('completa em <2s para 100 issues')
  test('usa transação única do Prisma')

  // Identifiers (2 testes)
  test('gera identifiers sequenciais corretos')
  test('não há gaps ou duplicatas')
})
```

---

## 🟡 TIER 3: MÉDIO (Semana 3-4)

### 7. Project Management (10+ testes)

**Arquivo:** `__tests__/api/projects.test.ts`

```typescript
describe('Project CRUD', () => {
  test('cria projeto com milestones')
  test('atualiza status do projeto')
  test('lista projetos por workspace')
  test('valida datas (startDate <= targetDate)')
  test('calcula estatísticas corretamente')
})
```

---

### 8. Workspace & Members (10+ testes)

**Arquivo:** `__tests__/api/workspaces.test.ts`

```typescript
describe('Workspace Management', () => {
  test('cria workspace com owner')
  test('adiciona membros com roles')
  test('valida permissões por role')
  test('impede acesso de não-membros')
})
```

---

### 9. Milestones & Reordering (8+ testes)

**Arquivo:** `__tests__/api/milestones.test.ts`

```typescript
describe('Milestone Reordering', () => {
  test('reordena milestones corretamente')
  test('mantém sortOrder consistente')
  test('valida que pertence ao mesmo projeto')
})
```

---

## 🟢 TIER 4: BAIXO (Semana 4)

### 10. Labels & Features (6+ testes)

```typescript
describe('Labels', () => {
  test('cria label única por workspace')
  test('impede duplicatas de nome')
})

describe('Features', () => {
  test('cria feature única por projeto')
  test('associa issues a features')
})
```

---

## 🚨 Issues Críticos Identificados

### 1. Race Condition: Issue Identifier

**Arquivo:** `src/app/api/issues/route.ts` (linha ~60)

**Problema:**
```typescript
// Geração de identifier não é atômica
const lastIssue = await prisma.issue.findFirst({
  where: { workspaceId },
  orderBy: { createdAt: 'desc' },
});
const nextIdentifier = lastIssue ? String(Number(lastIssue.identifier) + 1) : "1";
```

**Risco:** Duas requisições simultâneas podem gerar o mesmo identifier.

**Testes necessários:**
```typescript
test('identifiers únicos em requisições concorrentes', async () => {
  const promises = Array(10).fill(null).map(() =>
    createIssue({ workspaceId, ... })
  );
  const issues = await Promise.all(promises);
  const identifiers = issues.map(i => i.identifier);
  expect(new Set(identifiers).size).toBe(10); // Todos únicos
});
```

**Solução recomendada:**
```typescript
// Usar transação com lock ou sequence no banco
await prisma.$transaction(async (tx) => {
  const lastIssue = await tx.issue.findFirst({
    where: { workspaceId },
    orderBy: { identifier: 'desc' },
  });
  // ... criar com identifier
});
```

---

### 2. Security: Hardcoded Credentials

**Arquivo:** `src/app/api/generate-token/route.ts`

**Problema:**
```typescript
if (password !== "Projects172003") {
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
```

**Risco:** Senha exposta no código-fonte.

**Testes necessários:**
```typescript
test('não aceita senhas hardcoded em produção', () => {
  expect(process.env.NODE_ENV).not.toBe('production');
  // Ou verificar que endpoint está desabilitado
});
```

---

### 3. Data Integrity: Future reportedAt

**Arquivo:** `src/app/api/issues/route.ts`

**Problema:** Nenhuma validação impede `reportedAt` no futuro.

**Testes necessários:**
```typescript
test('rejeita reportedAt no futuro', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);

  await expect(createIssue({
    reportedAt: futureDate.toISOString()
  })).rejects.toThrow('reportedAt cannot be in the future');
});
```

---

### 4. Missing Validation: Time Entry Workspace

**Arquivo:** `src/app/api/time-entries/route.ts`

**Problema:** Não valida se usuário tem acesso ao workspace da issue.

**Testes necessários:**
```typescript
test('impede criar time entry para issue de workspace não autorizado', async () => {
  const otherWorkspaceIssue = await createIssue({
    workspaceId: 'other-workspace'
  });

  await expect(
    createTimeEntry({ issueId: otherWorkspaceIssue.id })
  ).rejects.toThrow('Access denied');
});
```

---

## 📊 Exemplo de Teste Completo

### business-hours.test.ts (parcial)

```typescript
import { describe, test, expect } from 'vitest';
import {
  calculateBusinessHours,
  addBusinessHours,
  checkSLAStatus
} from '@/lib/business-hours';

describe('calculateBusinessHours', () => {
  test('calcula horas dentro do mesmo dia útil', () => {
    // Segunda-feira, 9:00 AM → 2:00 PM = 5 horas
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-15T14:00:00');

    const minutes = calculateBusinessHours(start, end);

    expect(minutes).toBe(5 * 60); // 300 minutos
  });

  test('ignora fins de semana', () => {
    // Sexta 5:00 PM → Segunda 10:00 AM = 1 hora (só segunda)
    const start = new Date('2024-01-19T17:00:00'); // Sexta
    const end = new Date('2024-01-22T10:00:00'); // Segunda

    const minutes = calculateBusinessHours(start, end);

    expect(minutes).toBe(60); // 1 hora na segunda
  });

  test('calcula múltiplos dias completos', () => {
    // Segunda 9:00 AM → Sexta 6:00 PM = 5 dias × 9 horas
    const start = new Date('2024-01-15T09:00:00');
    const end = new Date('2024-01-19T18:00:00');

    const minutes = calculateBusinessHours(start, end);

    expect(minutes).toBe(5 * 9 * 60); // 2700 minutos
  });

  test('retorna 0 para fim antes do início', () => {
    const start = new Date('2024-01-15T14:00:00');
    const end = new Date('2024-01-15T09:00:00');

    const minutes = calculateBusinessHours(start, end);

    expect(minutes).toBe(0);
  });

  test('lida com horário fora do expediente', () => {
    // 8:00 AM → 7:00 PM = 9:00 AM → 6:00 PM = 9 horas
    const start = new Date('2024-01-15T08:00:00');
    const end = new Date('2024-01-15T19:00:00');

    const minutes = calculateBusinessHours(start, end);

    expect(minutes).toBe(9 * 60);
  });
});

describe('checkSLAStatus', () => {
  test('retorna "on-time" para <80% do SLA', () => {
    const start = new Date('2024-01-15T09:00:00');
    const current = new Date('2024-01-15T12:00:00'); // 3h de 8h = 37.5%

    const result = checkSLAStatus(start, 8, current);

    expect(result.status).toBe('on-time');
    expect(result.percentageUsed).toBeLessThan(80);
  });

  test('retorna "at-risk" para ≥80% e <100%', () => {
    const start = new Date('2024-01-15T09:00:00');
    const current = new Date('2024-01-16T14:00:00'); // ~14h de 16h = 87.5%

    const result = checkSLAStatus(start, 16, current);

    expect(result.status).toBe('at-risk');
    expect(result.percentageUsed).toBeGreaterThanOrEqual(80);
    expect(result.percentageUsed).toBeLessThan(100);
  });

  test('retorna "overdue" para ≥100%', () => {
    const start = new Date('2024-01-15T09:00:00');
    const current = new Date('2024-01-17T10:00:00'); // >8h

    const result = checkSLAStatus(start, 8, current);

    expect(result.status).toBe('overdue');
    expect(result.percentageUsed).toBeGreaterThanOrEqual(100);
  });
});
```

---

## 🗓️ Roadmap de Implementação (4 semanas)

### ✅ Semana 1: Setup + Testes Críticos - COMPLETA (16/11/2025)
- [x] Configurar Vitest, coverage (sem MSW por enquanto)
- [x] Criar estrutura de pastas `__tests__/`
- [x] Implementar `business-hours.test.ts` (49 testes - superou meta de 40)
- [x] Implementar `auth.test.ts` (26 testes - superou meta de 20)
- [x] Implementar `validation.test.ts` (39 testes - BÔNUS)
- [x] **Meta alcançada:** 114 testes (meta era 60+), 75.55% coverage em `lib/`
- [x] Criar documentação completa (3 arquivos .md)

### ⏳ Semana 2: Integração + Issues - PENDENTE
- [ ] Implementar `issue-workflow.test.ts` (25 testes)
- [ ] Implementar `sla-calculation.test.ts` (20 testes)
- [ ] Implementar `issues.test.ts` (20 testes - API)
- [ ] Corrigir race condition de identifiers (bug identificado)
- [ ] Meta: 179+ testes total (114 + 65 novos)

### ⏳ Semana 3: API + Time Tracking - PENDENTE
- [ ] Implementar `time-tracking.test.ts` (15 testes)
- [ ] Implementar `bulk-operations.test.ts` (10 testes)
- [ ] Implementar `projects.test.ts` (10 testes)
- [ ] Implementar `workspaces.test.ts` (10 testes)
- [ ] Meta: 224+ testes total

### ⏳ Semana 4: Finalização + CI/CD - PENDENTE
- [ ] Implementar testes restantes (milestones, labels, features)
- [ ] Adicionar testes de performance
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Documentar coverage report final
- [ ] Meta: 250+ testes, >85% coverage global

---

## 📈 Métricas de Sucesso

**Coverage Targets:**
- `src/lib/`: >90% (funções puras, críticas)
- `src/app/api/`: >80% (API endpoints)
- Global: >85%

**Performance:**
- Todos os testes unitários: <5s
- Todos os testes de integração: <30s
- Todos os testes E2E: <2min

**CI/CD:**
- Testes executam em cada PR
- Coverage report gerado automaticamente
- PR bloqueado se coverage cair

---

## 🛠️ Ferramentas Adicionais

### MSW (Mock Service Worker)

Para mockar APIs externas (se houver):

```typescript
// __mocks__/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/issues', () => {
    return HttpResponse.json({ id: 'mock-id' });
  }),
];
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

## 📝 Histórico de Implementação

### 16/11/2025 - Semana 1 Completa ✅

**Implementado por:** Claude Code

**Resumo:**
- ✅ Configuração completa do ambiente de testes
- ✅ 114 testes implementados (90% acima da meta)
- ✅ 100% dos testes passando
- ✅ Coverage de 75.55% em lib/ (próximo da meta de 80%)
- ✅ 3 arquivos de documentação criados

**Arquivos criados:**
- `__tests__/unit/business-hours.test.ts` (49 testes)
- `__tests__/unit/auth.test.ts` (26 testes)
- `__tests__/unit/validation.test.ts` (39 testes)
- `vitest.config.ts`
- `vitest.setup.ts`
- `.env.test`
- `docs/week-1-summary.md`
- `docs/testing-quick-reference.md`

**Resultados:**
```
Test Files:  3 passed (3)
Tests:       114 passed (114)
Duration:    ~500ms
Coverage:    lib/ 75.55%
```

**Próximo passo:** Implementar Semana 2 (testes de integração)

---

## 🎯 Próximos Passos

### Para continuar a implementação:

1. ✅ ~~Revisar este documento e priorizar testes~~ (Completo)
2. ✅ ~~Instalar dependências de teste~~ (Completo)
3. ✅ ~~Configurar Vitest~~ (Completo)
4. ✅ ~~Começar com TIER 1~~ (Completo - Semana 1)
5. **⏳ Implementar Semana 2:** issue-workflow, sla-calculation, issues API

### Comandos úteis:

```bash
# Executar testes existentes
npm test

# Ver coverage
npm run test:coverage

# Interface visual
npm run test:ui
```

---

**Última atualização:** 16/11/2025
**Status:** Semana 1 completa, Semanas 2-4 pendentes
