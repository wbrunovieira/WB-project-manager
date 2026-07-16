# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 project management app with issue tracking, time tracking, and SLA monitoring. Stack: TypeScript, Prisma 6 (SQLite), NextAuth v5 (beta), React 19, Tailwind CSS 4, shadcn/ui.

## Development Commands

Package manager: **pnpm** (pinned via `packageManager` in package.json; build scripts approved in `pnpm-workspace.yaml` `allowBuilds`).

```bash
pnpm dev                       # Start development server
pnpm build                     # Build for production
pnpm lint                      # Lint code
pnpm db:seed                   # Seed database with initial data
pnpm exec prisma migrate dev   # Run migrations after schema changes
pnpm exec prisma generate      # Regenerate Prisma client after schema changes
```

## Testing

Tests use **Vitest** with `happy-dom` environment. Test files are in `__tests__/`.

```bash
pnpm test                                          # Run all tests in watch mode
pnpm test -- --run                                 # Run all tests once (no watch)
pnpm test:unit                                     # Run only unit tests
pnpm test __tests__/unit/business-hours.test.ts    # Run a specific test file
pnpm test -- -t "test name pattern"                # Run tests matching a name pattern
pnpm test:coverage                                 # Run with coverage report
pnpm test:ui                                       # Visual test UI in browser
```

**Test structure:**
- `__tests__/unit/` — unit tests for `src/lib/` (business-hours, auth/api-auth, validation, reorder)
- `__tests__/integration/` and `__tests__/api/` — planned, not yet implemented

**Test setup** (`vitest.setup.ts`):
- Auto-mocks `@/lib/auth` (NextAuth) and `@/lib/prisma` (Prisma client with all models)
- Sets test environment variables (`DATABASE_URL`, `AUTH_SECRET`, `API_KEY`, etc.)
- Mocks reset automatically between tests via `mockReset`, `restoreMocks`, `clearMocks`
- Cast NextAuth mock: `const mockAuth = auth as unknown as ReturnType<typeof vi.fn>`

## Database Setup

1. Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL` — SQLite database path (default: `file:./dev.db`)
   - `AUTH_SECRET` — Random secret for NextAuth
   - `NEXTAUTH_URL` — Application URL
   - Seed user credentials (`SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`)
   - `ALLOWED_ORIGIN` — For CORS if integrating external apps
   - `API_KEY` / `API_KEY_USER_ID` — For API key authentication

2. Run Prisma migrations and seed:
```bash
pnpm exec prisma migrate dev
pnpm db:seed
```

## Architecture

### Authentication & Authorization

- **NextAuth v5** (beta) with JWT strategy configured in `src/lib/auth.ts`
- Credentials provider with bcrypt password hashing; session includes user ID
- Middleware (`src/middleware.ts`) protects all routes except `/api/*`, `/_next/*`, favicon; redirects unauthenticated users to `/login`
- API routes use `withAuth` wrapper from `src/lib/api-auth.ts` — supports both API Key (Bearer token) and Session Cookie auth
- API Key validated using SHA-256 hash comparison against `API_KEY` env var
- CORS configured in `withCors` helper for external app integration

### Application Structure

**Route Groups:**
- `app/(auth)/` — Public authentication pages (login, register)
- `app/(main)/` — Protected application pages with shared layout
- `app/api/` — API routes for CRUD operations

**Key Protected Routes:**
- `/(main)/dashboard` — Main dashboard
- `/(main)/projects` — Projects list and `[projectId]` detail view
- `/(main)/my-issues` — User's assigned issues
- `/(main)/time-tracking` — Time tracking overview
- `/(main)/maintenance` — Maintenance dashboard
- `/(main)/workspaces` — Workspace management

### Data Model Hierarchy

**Workspace → Projects → Issues**

1. **Workspace**: Top-level org unit with members (roles: OWNER, ADMIN, MEMBER, GUEST), labels, and statuses
2. **Project**: Types (DEVELOPMENT, MAINTENANCE), statuses (PLANNED, IN_PROGRESS, COMPLETED, CANCELED). Contains milestones, features (categorization with colors), and SLA configs
3. **Issue**: Types (FEATURE, MAINTENANCE, BUG, IMPROVEMENT), priorities (URGENT, HIGH, MEDIUM, LOW, NO_PRIORITY). Linked to status, assignee, labels, milestone, feature. Tracks comments, time entries, and SLA metrics

**Ordering**: Issues, milestones, and projects each have an `order` field. Reorder via `PUT /api/issues/reorder`, `PUT /api/milestones/reorder`, `PUT /api/projects/reorder`.

### Time Tracking System

- `TimeTrackerContext` (`src/contexts/time-tracker-context.tsx`) provides global state; hook: `useTimeTracker()`
- Real-time elapsed time updated every 1 second for all active entries
- `FloatingTimer` component shows active timers as UI overlay
- API: `POST /api/time-entries` (start), `PATCH /api/time-entries/[id]` (stop)

### Business Hours & SLA Tracking

**Business Hours** (`src/lib/business-hours.ts`):
- Monday–Friday, 9 AM–6 PM (9 hours/day)
- All SLA calculations use business hours, not calendar time
- Key functions: `calculateBusinessHours`, `checkSLAStatus`, `addBusinessHours`, `isBusinessHours`

**SLA Metrics** (tracked on Issue model):
- `reportedAt` — Editable; defaults to `createdAt`
- `firstResponseAt` — Auto-set when issue moves to IN_PROGRESS
- `resolvedAt` — Auto-set when issue moves to DONE
- `resolutionTimeMinutes` — Business hours from `reportedAt` to `resolvedAt`
- `reopenCount` — Increments each time issue moves from DONE back to non-DONE

**SLA Config** (per project): `firstResponseTimeHours` and `resolutionTimeHours` per issue type/priority combination. Status colors: green (on-time), yellow (at-risk ≥80%), red (overdue ≥100%).

### Prisma Configuration

- Custom output path: `src/generated/prisma` (configured in `prisma/schema.prisma`)
- Import from: `@/generated/prisma`
- `eslint.config.mjs` must ignore `src/generated/**` to avoid linting generated code

### UI Components

- **shadcn/ui** components in `src/components/ui/`
- `@dnd-kit` for drag-and-drop reordering (issues, milestones, projects)
- React Hook Form + Zod for all forms
- Toast component requires `cva` variants for `variant="destructive"` to work

### Layout Hierarchy

```
app/layout.tsx (Root: Toaster, global styles)
└── (main)/layout.tsx (Protected pages)
    └── TimeTrackerProvider
        ├── Sidebar
        ├── Header
        ├── {page content}
        └── FloatingTimer (active timer overlay)
```

## Important Patterns

### API Route Pattern

```typescript
import { withAuth, withCors } from "@/lib/api-auth";

export const GET = withAuth(async (req, userId) => {
  const response = NextResponse.json({ data });
  return withCors(response);
});
```

### Issue Status Side Effects

When updating issue status via `PATCH /api/issues/[id]`:
- Moving to IN_PROGRESS → set `firstResponseAt` if not already set
- Moving to DONE → set `resolvedAt`, calculate `resolutionTimeMinutes`
- Moving from DONE → increment `reopenCount`, clear `resolvedAt`

### TypeScript / ESLint Gotchas

- Prisma `Date` objects must be serialized (`.toISOString()`) before passing to Client Components — use `Date | string` or `string` in client-facing interfaces
- `any` → `Record<string, unknown>` for dynamic objects
- API response casting: `response.json()` → `as unknown as Type` in callers
- Unused catch params: `catch {` not `catch (error)`
- HTML entities in JSX: `&apos;`, `&ldquo;`, `&rdquo;`
- Empty interfaces → type aliases: `type X = React.HTMLAttributes<...>`
- Most UI components are Client Components (`"use client"`) due to interactive forms and time tracker context

## Path Aliases

Use `@/` prefix for imports from `src/`:
```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Issue } from "@/generated/prisma";
```

## External Integration

- `scripts/API-KEY-AUTH.md` — API key auth details
- `scripts/BULK-CREATE-API.md` — Bulk issue creation (1–100 issues per request)
- `POST /api/issues` and `POST /api/issues/bulk` support both Bearer token and session cookie auth

## Deployment

Production server at `45.90.123.190` (`projects.wbdigitalsolutions.com`), port 3002, deployed via Docker + Ansible.

```bash
# Quick redeploy (git pull + docker rebuild)
TMPFILE=$(mktemp) && printf '%s' 'wb2026@' > "$TMPFILE" && cd deploy/ansible && ansible-playbook playbooks/quick-deploy.yml --vault-password-file "$TMPFILE" -v; rm -f "$TMPFILE"
```

The Docker build uses pnpm (via corepack, Node 24) for the deps/build stages. The Prisma CLI for runtime migrations comes from a dedicated `prisma-cli` stage that npm-installs `prisma` (flat layout, version read from package.json) into `/app/prisma-cli/node_modules` — kept separate from the standalone build's `node_modules` to avoid symlink collisions. The entrypoint invokes it via `node prisma-cli/node_modules/prisma/build/index.js migrate deploy` (no `npx`/`pnpm` in the runner).
