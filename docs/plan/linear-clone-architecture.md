# Linear Clone - Plano de Arquitetura e Desenvolvimento

## 🎯 Visão Geral do Projeto

Construir um clone do Linear - uma ferramenta moderna de gerenciamento de projetos e issues, focada em velocidade, experiência do usuário excepcional e produtividade para equipes de desenvolvimento.

**Stack Tecnológica:**
- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Next.js API Routes / Server Actions
- **Banco de Dados:** SQLite com Prisma ORM
- **Estilização:** Tailwind CSS + Radix UI
- **Autenticação:** NextAuth.js
- **Estado:** Zustand / React Query
- **Animações:** Framer Motion

---

## 📋 Funcionalidades Core (MVP)

### Fase 1: Fundação (Semanas 1-2)
1. **Autenticação e Usuários**
   - Login/Registro com email
   - Gerenciamento de perfil
   - Workspaces/Organizations
   - Convites de equipe

2. **Schema de Dados Básico**
   - Users
   - Workspaces
   - Teams
   - Projects
   - Issues
   - Labels
   - Comments

### Fase 2: Gerenciamento de Issues (Semanas 3-4)
1. **CRUD de Issues**
   - Criar issue com atalhos de teclado (Cmd+K)
   - Edição inline
   - Atribuição de responsáveis
   - Prioridades (Urgent, High, Medium, Low, No Priority)
   - Status customizáveis
   - Labels e tags

2. **Interface de Visualização**
   - List View (padrão)
   - Board View (Kanban)
   - Filtros avançados
   - Busca global (Cmd+K)
   - Ordenação e agrupamento

### Fase 3: Projetos e Organização (Semanas 5-6)
1. **Projects**
   - Criar e gerenciar projetos
   - Milestones/Roadmap visual
   - Progresso do projeto
   - Vincular issues a projetos

2. **Teams**
   - Múltiplos times por workspace
   - Issues por time
   - Membros e permissões

### Fase 4: Colaboração (Semana 7)
1. **Comentários**
   - Sistema de comentários em issues
   - Markdown support
   - Menções (@user)
   - Anexos

2. **Atividades**
   - Feed de atividades
   - Histórico de mudanças
   - Notificações

### Fase 5: Performance e UX (Semana 8)
1. **Otimizações**
   - Navegação por teclado completa
   - Loading states optimistas
   - Infinite scroll
   - Debouncing em buscas
   - Cache inteligente

2. **Command Palette**
   - Busca universal (Cmd+K)
   - Comandos rápidos
   - Navegação por teclado

---

## 🗄️ Modelo de Dados (Prisma Schema)

```prisma
// Versão simplificada - expandir conforme necessário

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  workspaces    WorkspaceMember[]
  createdIssues Issue[]   @relation("IssueCreator")
  assignedIssues Issue[]  @relation("IssueAssignee")
  comments      Comment[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Workspace {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  icon      String?
  members   WorkspaceMember[]
  teams     Team[]
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  role        Role      @default(MEMBER)
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  createdAt   DateTime  @default(now())

  @@unique([userId, workspaceId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

model Team {
  id          String    @id @default(cuid())
  name        String
  key         String    // Ex: "ENG", "DESIGN"
  icon        String?
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  issues      Issue[]
  members     TeamMember[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([workspaceId, key])
}

model TeamMember {
  id        String   @id @default(cuid())
  team      Team     @relation(fields: [teamId], references: [id])
  teamId    String
  userId    String
  createdAt DateTime @default(now())

  @@unique([teamId, userId])
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(PLANNED)
  startDate   DateTime?
  targetDate  DateTime?
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  issues      Issue[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum ProjectStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELED
}

model Issue {
  id          String    @id @default(cuid())
  identifier  String    // Ex: "ENG-123"
  title       String
  description String?
  priority    Priority  @default(NO_PRIORITY)
  status      Status    @relation(fields: [statusId], references: [id])
  statusId    String
  team        Team      @relation(fields: [teamId], references: [id])
  teamId      String
  project     Project?  @relation(fields: [projectId], references: [id])
  projectId   String?
  creator     User      @relation("IssueCreator", fields: [creatorId], references: [id])
  creatorId   String
  assignee    User?     @relation("IssueAssignee", fields: [assigneeId], references: [id])
  assigneeId  String?
  labels      IssueLabel[]
  comments    Comment[]
  sortOrder   Float     // Para ordenação customizada
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([teamId, identifier])
  @@index([teamId, status])
  @@index([assigneeId])
  @@index([projectId])
}

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
  NO_PRIORITY
}

model Status {
  id          String   @id @default(cuid())
  name        String
  type        StatusType
  position    Int
  teamId      String?
  workspaceId String
  issues      Issue[]
  createdAt   DateTime @default(now())

  @@unique([workspaceId, name])
}

enum StatusType {
  BACKLOG
  TODO
  IN_PROGRESS
  DONE
  CANCELED
}

model Label {
  id          String    @id @default(cuid())
  name        String
  color       String
  workspaceId String
  issues      IssueLabel[]
  createdAt   DateTime  @default(now())

  @@unique([workspaceId, name])
}

model IssueLabel {
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId   String
  label     Label    @relation(fields: [labelId], references: [id], onDelete: Cascade)
  labelId   String

  @@id([issueId, labelId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🎨 Design System e UI

### Componentes Principais

1. **Layout**
   - Sidebar (navegação)
   - Command Bar (Cmd+K)
   - Issue Modal/Panel
   - Toast notifications

2. **Issue Components**
   - IssueRow (list view)
   - IssueCard (board view)
   - IssueDetail (modal/side panel)
   - QuickCreate (inline)

3. **Form Components**
   - Priority Selector
   - Status Dropdown
   - Assignee Picker
   - Label Picker
   - Date Picker

4. **Navigation**
   - Global Search
   - Breadcrumbs
   - Team Switcher
   - View Switcher

### Paleta de Cores (Inspirado no Linear)
```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;

  /* Borders */
  --border-primary: #e5e7eb;
  --border-secondary: #f3f4f6;

  /* Accent */
  --accent-primary: #5e6ad2;
  --accent-hover: #4c5abf;

  /* Priorities */
  --priority-urgent: #ef4444;
  --priority-high: #f59e0b;
  --priority-medium: #3b82f6;
  --priority-low: #6b7280;
}
```

---

## 🚀 Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── [workspaceSlug]/
│   │   │   ├── team/[teamKey]/
│   │   │   │   ├── page.tsx (issues list)
│   │   │   │   └── board/page.tsx
│   │   │   ├── project/[projectId]/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── issues/
│   │   ├── projects/
│   │   └── teams/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn/radix components)
│   ├── issues/
│   ├── projects/
│   ├── layout/
│   └── command/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
│   ├── use-issues.ts
│   ├── use-keyboard.ts
│   └── use-command.ts
├── stores/
│   └── ui-store.ts
└── types/
    └── index.ts
```

---

## ⌨️ Atalhos de Teclado (Essencial para UX)

| Atalho | Ação |
|--------|------|
| `Cmd+K` | Command palette |
| `C` | Criar issue |
| `Cmd+Enter` | Salvar issue |
| `/` | Buscar/filtrar |
| `Cmd+Shift+K` | Alternar projeto |
| `1-5` | Alterar prioridade (quando em issue) |
| `A` | Atribuir a mim |
| `Escape` | Fechar modal/limpar |
| `Arrow Up/Down` | Navegar issues |
| `Enter` | Abrir issue selecionada |

---

## 🔥 Features Premium (Pós-MVP)

1. **Cycles** (Sprints)
   - Planejamento de sprints
   - Velocity tracking
   - Burndown charts

2. **Views Customizadas**
   - Salvar filtros
   - Views compartilhadas
   - Personalização avançada

3. **Integrações**
   - GitHub (sync de PRs)
   - Slack (notificações)
   - Figma (anexar designs)

4. **Analytics**
   - Métricas de time
   - Cycle time
   - Throughput

5. **Automações**
   - Regras customizadas
   - Auto-assign
   - Status transitions

6. **AI Features**
   - Auto-categorização
   - Sugestões de prioridade
   - Templates inteligentes

---

## 📊 Métricas de Sucesso

1. **Performance**
   - First Contentful Paint < 1s
   - Time to Interactive < 2s
   - Smooth 60fps animations

2. **UX**
   - Todas as ações principais acessíveis por teclado
   - Feedback visual imediato (optimistic updates)
   - Zero loading spinners desnecessários

3. **Qualidade do Código**
   - 100% TypeScript
   - Componentes reutilizáveis
   - Testes para lógica crítica

---

## 🎯 Roadmap de Desenvolvimento

### Sprint 1 (Semana 1-2): Setup + Auth
- [ ] Setup Next.js + Prisma + SQLite
- [ ] Schema inicial do banco
- [ ] Autenticação com NextAuth
- [ ] Layout base e navegação
- [ ] Command Palette básico

### Sprint 2 (Semana 3-4): Issues Core
- [ ] CRUD de issues
- [ ] List view com filtros
- [ ] Priority/Status management
- [ ] Assignee system
- [ ] Atalhos de teclado

### Sprint 3 (Semana 5-6): Projetos
- [ ] Project management
- [ ] Teams
- [ ] Labels
- [ ] Board view (Kanban)
- [ ] Drag & drop

### Sprint 4 (Semana 7): Colaboração
- [ ] Comentários
- [ ] Activity feed
- [ ] Notificações
- [ ] @mentions

### Sprint 5 (Semana 8): Polish
- [ ] Animações e transições
- [ ] Optimistic updates
- [ ] Error handling
- [ ] Loading states
- [ ] Responsividade mobile

---

## 🛠️ Tecnologias e Bibliotecas

### Core
- **Next.js 14+** - Framework
- **Prisma** - ORM
- **SQLite** - Database (pode migrar para PostgreSQL)
- **TypeScript** - Type safety

### UI/UX
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **cmdk** - Command palette
- **react-hot-toast** - Notifications

### Estado e Data Fetching
- **Zustand** - Client state
- **React Query (TanStack Query)** - Server state
- **SWR** - Alternative para React Query

### Forms e Validação
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Outros
- **next-auth** - Authentication
- **date-fns** - Date utilities
- **dnd-kit** - Drag and drop
- **tiptap** - Rich text editor (comentários)

---

## 🎨 Princípios de Design

1. **Speed First**
   - Toda interação deve ser instantânea
   - Optimistic updates em tudo
   - Preload de dados críticos

2. **Keyboard-Driven**
   - Toda ação acessível por teclado
   - Navegação fluida
   - Command palette como hub central

3. **Minimal & Clean**
   - Interface clean sem distrações
   - Informação hierarquizada
   - Whitespace intencional

4. **Feedback Constante**
   - Visual feedback em todas as ações
   - Loading states claros
   - Error handling elegante

---

## 🚨 Desafios Técnicos Antecipados

1. **Performance com muitas issues**
   - Solução: Virtualização (react-virtual), paginação, indexação no DB

2. **Real-time updates**
   - Solução: Polling otimizado, WebSockets (fase 2), optimistic updates

3. **Busca rápida**
   - Solução: Full-text search no SQLite, debouncing, índices

4. **Drag & drop complexo**
   - Solução: dnd-kit com persistência otimista

5. **Sincronização de estado**
   - Solução: React Query com invalidação inteligente

---

## ✅ Checklist de Qualidade

- [ ] TypeScript strict mode
- [ ] ESLint + Prettier configurados
- [ ] Acessibilidade (ARIA, keyboard nav)
- [ ] SEO básico
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsivo
- [ ] Dark mode (opcional)
- [ ] Testes unitários (core logic)

---

## 📝 Próximos Passos

1. **Setup inicial do projeto**
   - `npx create-next-app@latest`
   - Configurar Prisma + SQLite
   - Setup Tailwind + configuração de cores

2. **Schema do banco de dados**
   - Criar schema.prisma completo
   - Executar migrations
   - Seed inicial

3. **Componentes base**
   - Layout structure
   - Design system básico
   - Command palette

4. **Feature: Issues**
   - Começar pelo CRUD mais simples
   - Iterar e adicionar complexidade

---

**Nota:** Este é um projeto ambicioso que resultará em uma aplicação de alta qualidade. O foco deve ser sempre na experiência do usuário, performance e código limpo. Cada feature deve ser testada e refinada antes de passar para a próxima.
