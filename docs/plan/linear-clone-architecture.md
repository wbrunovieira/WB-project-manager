# Linear Clone - Plano de Arquitetura e Desenvolvimento

## 🎯 Visão Geral do Projeto

Construir um clone do Linear - uma ferramenta moderna de gerenciamento de projetos e issues, focada em velocidade, experiência do usuário excepcional e produtividade para equipes de desenvolvimento.

**Stack Tecnológica:**
- ✅ **Frontend:** Next.js 15 (App Router)
- ✅ **Backend:** Next.js API Routes / Server Actions
- ✅ **Banco de Dados:** SQLite com Prisma ORM
- ✅ **Estilização:** Tailwind CSS v4 + Radix UI
- ✅ **Autenticação:** NextAuth.js v5
- ⏳ **Estado:** Zustand / React Query
- ⏳ **Animações:** Framer Motion

---

## 📋 Funcionalidades Core (MVP)

### Fase 1: Fundação (Semanas 1-2)
1. **Autenticação e Usuários**
   - [ ] Login/Registro com email
   - [ ] Gerenciamento de perfil
   - [ ] Workspaces/Organizations
   - [ ] Convites de equipe

2. **Schema de Dados Básico**
   - ✅ Users
   - ✅ Workspaces
   - ✅ Teams
   - ✅ Projects
   - ✅ Issues
   - ✅ Labels
   - ✅ Comments

### Fase 2: Gerenciamento de Issues (Semanas 3-4)
1. **CRUD de Issues**
   - [ ] Criar issue com atalhos de teclado (Cmd+K)
   - [ ] Edição inline
   - [ ] Atribuição de responsáveis
   - [ ] Prioridades (Urgent, High, Medium, Low, No Priority)
   - [ ] Status customizáveis
   - [ ] Labels e tags

2. **Interface de Visualização**
   - [ ] List View (padrão)
   - [ ] Board View (Kanban)
   - [ ] Filtros avançados
   - [ ] Busca global (Cmd+K)
   - [ ] Ordenação e agrupamento

### Fase 3: Projetos e Organização (Semanas 5-6)
1. **Projects**
   - [ ] Criar e gerenciar projetos
   - [ ] Milestones/Roadmap visual
   - [ ] Progresso do projeto
   - [ ] Vincular issues a projetos

2. **Teams**
   - [ ] Múltiplos times por workspace
   - [ ] Issues por time
   - [ ] Membros e permissões

### Fase 4: Colaboração (Semana 7)
1. **Comentários**
   - [ ] Sistema de comentários em issues
   - [ ] Markdown support
   - [ ] Menções (@user)
   - [ ] Anexos

2. **Atividades**
   - [ ] Feed de atividades
   - [ ] Histórico de mudanças
   - [ ] Notificações

### Fase 5: Performance e UX (Semana 8)
1. **Otimizações**
   - [ ] Navegação por teclado completa
   - [ ] Loading states optimistas
   - [ ] Infinite scroll
   - [ ] Debouncing em buscas
   - [ ] Cache inteligente

2. **Command Palette**
   - [ ] Busca universal (Cmd+K)
   - [ ] Comandos rápidos
   - [ ] Navegação por teclado

---

## 🗄️ Modelo de Dados (Prisma Schema)

✅ **Schema implementado e migrado** - Veja `prisma/schema.prisma`

Modelos principais:
- ✅ User (com hash de senha)
- ✅ Workspace (com slug único)
- ✅ WorkspaceMember (com roles: OWNER, ADMIN, MEMBER, GUEST)
- ✅ Team (com key única por workspace)
- ✅ TeamMember
- ✅ Project (com status: PLANNED, IN_PROGRESS, COMPLETED, CANCELED)
- ✅ Issue (com prioridades e identifiers únicos por time)
- ✅ Status (customizável por workspace)
- ✅ Label (com cores)
- ✅ IssueLabel (junction table)
- ✅ Comment

---

## 🎨 Design System e UI

### Componentes Principais

1. **Layout**
   - [ ] Sidebar (navegação)
   - [ ] Command Bar (Cmd+K)
   - [ ] Issue Modal/Panel
   - [ ] Toast notifications

2. **Issue Components**
   - [ ] IssueRow (list view)
   - [ ] IssueCard (board view)
   - [ ] IssueDetail (modal/side panel)
   - [ ] QuickCreate (inline)

3. **Form Components**
   - [ ] Priority Selector
   - [ ] Status Dropdown
   - [ ] Assignee Picker
   - [ ] Label Picker
   - [ ] Date Picker

4. **Navigation**
   - [ ] Global Search
   - [ ] Breadcrumbs
   - [ ] Team Switcher
   - [ ] View Switcher

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
│   ├── (auth)/                    ⏳ TODO
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                    ⏳ TODO
│   │   ├── [workspaceSlug]/
│   │   │   ├── team/[teamKey]/
│   │   │   │   ├── page.tsx (issues list)
│   │   │   │   └── board/page.tsx
│   │   │   ├── project/[projectId]/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── api/                       ⏳ TODO
│   │   ├── auth/[...nextauth]/
│   │   ├── issues/
│   │   ├── projects/
│   │   └── teams/
│   ├── layout.tsx                 ✅ DONE
│   └── page.tsx                   ✅ DONE
├── components/                    ⏳ TODO
│   ├── ui/ (shadcn/radix components)
│   ├── issues/
│   ├── projects/
│   ├── layout/
│   └── command/
├── lib/
│   ├── prisma.ts                  ✅ DONE
│   ├── auth.ts                    ⏳ TODO
│   └── utils.ts                   ✅ DONE
├── hooks/                         ⏳ TODO
│   ├── use-issues.ts
│   ├── use-keyboard.ts
│   └── use-command.ts
├── stores/                        ⏳ TODO
│   └── ui-store.ts
└── types/                         ⏳ TODO
    └── index.ts
```

---

## ⌨️ Atalhos de Teclado (Essencial para UX)

| Atalho | Ação | Status |
|--------|------|--------|
| `Cmd+K` | Command palette | ⏳ TODO |
| `C` | Criar issue | ⏳ TODO |
| `Cmd+Enter` | Salvar issue | ⏳ TODO |
| `/` | Buscar/filtrar | ⏳ TODO |
| `Cmd+Shift+K` | Alternar projeto | ⏳ TODO |
| `1-5` | Alterar prioridade (quando em issue) | ⏳ TODO |
| `A` | Atribuir a mim | ⏳ TODO |
| `Escape` | Fechar modal/limpar | ⏳ TODO |
| `Arrow Up/Down` | Navegar issues | ⏳ TODO |
| `Enter` | Abrir issue selecionada | ⏳ TODO |

---

## 🔥 Features Premium (Pós-MVP)

1. **Cycles** (Sprints)
   - [ ] Planejamento de sprints
   - [ ] Velocity tracking
   - [ ] Burndown charts

2. **Views Customizadas**
   - [ ] Salvar filtros
   - [ ] Views compartilhadas
   - [ ] Personalização avançada

3. **Integrações**
   - [ ] GitHub (sync de PRs)
   - [ ] Slack (notificações)
   - [ ] Figma (anexar designs)

4. **Analytics**
   - [ ] Métricas de time
   - [ ] Cycle time
   - [ ] Throughput

5. **Automações**
   - [ ] Regras customizadas
   - [ ] Auto-assign
   - [ ] Status transitions

6. **AI Features**
   - [ ] Auto-categorização
   - [ ] Sugestões de prioridade
   - [ ] Templates inteligentes

---

## 📊 Métricas de Sucesso

1. **Performance**
   - [ ] First Contentful Paint < 1s
   - [ ] Time to Interactive < 2s
   - [ ] Smooth 60fps animations

2. **UX**
   - [ ] Todas as ações principais acessíveis por teclado
   - [ ] Feedback visual imediato (optimistic updates)
   - [ ] Zero loading spinners desnecessários

3. **Qualidade do Código**
   - [ ] TypeScript strict mode
   - [ ] Componentes reutilizáveis
   - [ ] Testes para lógica crítica

---

## 🎯 Roadmap de Desenvolvimento

### Sprint 1 (Semana 1-2): Setup + Auth
- ✅ Setup Next.js + Prisma + SQLite
- ✅ Schema inicial do banco
- ✅ Instalação de dependências (Radix UI, cmdk, zod, etc.)
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
- ✅ **Next.js 15** - Framework
- ✅ **Prisma 6.16.3** - ORM
- ✅ **SQLite** - Database
- ✅ **TypeScript 5** - Type safety

### UI/UX
- ✅ **Tailwind CSS v4** - Styling
- ✅ **Radix UI** - Accessible components
  - ✅ @radix-ui/react-dropdown-menu
  - ✅ @radix-ui/react-dialog
  - ✅ @radix-ui/react-popover
  - ✅ @radix-ui/react-select
  - ✅ @radix-ui/react-toast
  - ✅ @radix-ui/react-avatar
  - ✅ @radix-ui/react-label
  - ✅ @radix-ui/react-slot
- ⏳ **Framer Motion** - Animations (TODO)
- ✅ **cmdk** - Command palette
- ✅ **lucide-react** - Icons

### Estado e Data Fetching
- ⏳ **Zustand** - Client state (TODO)
- ⏳ **React Query (TanStack Query)** - Server state (TODO)

### Forms e Validação
- ✅ **React Hook Form** - Form management
- ✅ **Zod 4.1.11** - Schema validation
- ✅ **@hookform/resolvers** - Integration

### Outros
- ✅ **next-auth 5.0.0-beta.29** - Authentication
- ✅ **bcryptjs** - Password hashing
- ✅ **date-fns 4.1.0** - Date utilities
- ⏳ **dnd-kit** - Drag and drop (TODO)
- ⏳ **tiptap** - Rich text editor (TODO)
- ✅ **class-variance-authority** - Component variants
- ✅ **clsx + tailwind-merge** - Utility for className

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
- ✅ ESLint configurado
- [ ] Prettier configurado
- [ ] Acessibilidade (ARIA, keyboard nav)
- [ ] SEO básico
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsivo
- [ ] Dark mode (opcional)
- [ ] Testes unitários (core logic)

---

## 📝 Próximos Passos Imediatos

### 1. Autenticação (NextAuth v5)
- [ ] Configurar NextAuth.js v5
- [ ] Criar páginas de login/registro
- [ ] Implementar hash de senhas com bcryptjs
- [ ] Criar middleware de proteção de rotas
- [ ] Implementar sessões

### 2. Seed do Banco de Dados
- [ ] Criar arquivo `prisma/seed.ts`
- [ ] Adicionar dados de exemplo (workspace, teams, statuses)
- [ ] Popular com issues de exemplo

### 3. Layout Base
- [ ] Criar componentes base de UI (Button, Input, Card, etc.)
- [ ] Implementar sidebar de navegação
- [ ] Criar header com user menu
- [ ] Implementar workspace switcher

### 4. Command Palette
- [ ] Integrar cmdk
- [ ] Implementar busca global
- [ ] Adicionar comandos rápidos
- [ ] Implementar navegação por teclado

---

## 🔌 API REST Endpoints (Next.js API Routes)

**Objetivo:** Criar APIs REST públicas para permitir integração com outras aplicações

### Projects API
- [ ] `GET /api/projects` - List all projects
- [ ] `GET /api/projects/:id` - Get project by ID
- [ ] `POST /api/projects` - Create new project
- [ ] `PATCH /api/projects/:id` - Update project
- [ ] `DELETE /api/projects/:id` - Delete project
- [ ] `GET /api/projects/:id/issues` - Get project issues

### Issues API
- [ ] `GET /api/issues` - List all issues (with filters)
- [ ] `GET /api/issues/:id` - Get issue by ID
- [ ] `POST /api/issues` - Create new issue
- [ ] `PATCH /api/issues/:id` - Update issue
- [ ] `DELETE /api/issues/:id` - Delete issue
- [ ] `GET /api/issues/:id/comments` - Get issue comments
- [ ] `POST /api/issues/:id/comments` - Add comment to issue

### Teams API
- [ ] `GET /api/teams` - List all teams
- [ ] `GET /api/teams/:id` - Get team by ID
- [ ] `POST /api/teams` - Create new team
- [ ] `PATCH /api/teams/:id` - Update team
- [ ] `DELETE /api/teams/:id` - Delete team
- [ ] `GET /api/teams/:id/members` - Get team members
- [ ] `POST /api/teams/:id/members` - Add team member

### Workspaces API
- [ ] `GET /api/workspaces` - List user workspaces
- [ ] `GET /api/workspaces/:id` - Get workspace by ID
- [ ] `POST /api/workspaces` - Create workspace
- [ ] `PATCH /api/workspaces/:id` - Update workspace
- [ ] `GET /api/workspaces/:id/members` - Get workspace members
- [ ] `POST /api/workspaces/:id/members` - Invite member

### Labels API
- [ ] `GET /api/labels` - List all labels
- [ ] `POST /api/labels` - Create label
- [ ] `PATCH /api/labels/:id` - Update label
- [ ] `DELETE /api/labels/:id` - Delete label

### Statuses API
- [ ] `GET /api/statuses` - List all statuses
- [ ] `POST /api/statuses` - Create custom status
- [ ] `PATCH /api/statuses/:id` - Update status
- [ ] `DELETE /api/statuses/:id` - Delete status

### Users API
- [ ] `GET /api/users/me` - Get current user
- [ ] `PATCH /api/users/me` - Update current user profile
- [ ] `GET /api/users/:id` - Get user by ID

### Comments API
- [ ] `GET /api/comments/:id` - Get comment by ID
- [ ] `PATCH /api/comments/:id` - Update comment
- [ ] `DELETE /api/comments/:id` - Delete comment

**API Features:**
- [ ] API authentication (Bearer token or API keys)
- [ ] Rate limiting
- [ ] CORS configuration for external apps
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Request validation with Zod
- [ ] Error handling middleware
- [ ] Pagination for list endpoints
- [ ] Filtering and sorting support

---

## 📊 Status Geral do Projeto

**Progresso:** Sprint 1 - 80% completo

### ✅ Concluído
- Inicialização do projeto Next.js 15
- Configuração do Prisma com SQLite
- Schema do banco de dados completo
- Migração inicial executada
- Instalação de todas as bibliotecas de UI
- Autenticação completa com NextAuth v5
- Páginas de login/registro
- Seed do banco de dados
- Layout base com sidebar e header
- Dashboard com lista de issues
- Página de projetos (list e detail)
- Issues agrupadas por status
- UI components (Button, Input, Card, Avatar, etc.)
- Utilitários (cn, prisma singleton)

### 🚧 Em Progresso
- API REST endpoints para integração externa

### ⏳ Próximo
- CRUD APIs para Projects
- CRUD APIs para Issues
- CRUD APIs para Teams, Workspaces, Labels
- API authentication
- Command palette
- Issue modal/editor

---

**Nota:** Este é um projeto ambicioso que resultará em uma aplicação de alta qualidade. O foco deve ser sempre na experiência do usuário, performance e código limpo. Cada feature deve ser testada e refinada antes de passar para a próxima.

**Legenda:**
- ✅ DONE - Completo
- 🚧 WIP - Em progresso
- ⏳ TODO - Pendente
- ❌ BLOCKED - Bloqueado
