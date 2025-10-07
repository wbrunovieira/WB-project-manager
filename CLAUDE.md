# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15-based project management application with issue tracking, time tracking, and SLA monitoring capabilities. Built with TypeScript, Prisma (SQLite), and NextAuth for authentication.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Seed database with initial data
npm run db:seed
```

## API Endpoints for External Integration

### Single Issue Creation
```
POST /api/issues
```
Creates a single issue. See `scripts/API-KEY-AUTH.md` for details.

### Bulk Issue Creation
```
POST /api/issues/bulk
```
Creates multiple issues (1-100) in a single transaction. See `scripts/BULK-CREATE-API.md` for details.

Both endpoints support API Key (Bearer token) and Session Cookie authentication.

## Database Setup

1. Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL` - SQLite database path (default: `file:./dev.db`)
   - `AUTH_SECRET` - Random secret for NextAuth
   - `NEXTAUTH_URL` - Application URL
   - Seed user credentials (`SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`)
   - `ALLOWED_ORIGIN` - For CORS if integrating external apps

2. Run Prisma migrations and seed:
```bash
npx prisma migrate dev
npm run db:seed
```

## Architecture

### Authentication & Authorization

- **NextAuth v5** (beta) with JWT strategy configured in `src/lib/auth.ts`
- Credentials provider with bcrypt password hashing
- Session management via JWT tokens with user ID in session
- Middleware (`src/middleware.ts`) protects routes, redirects unauthenticated users to `/login`
- API routes use `withAuth` wrapper from `src/lib/api-auth.ts` for authentication checks
- CORS configured in `withCors` helper for external app integration

### Application Structure

**Route Groups:**
- `app/(auth)/` - Public authentication pages (login, register)
- `app/(main)/` - Protected application pages with layout and sidebar
- `app/api/` - API routes for CRUD operations

**Key Routes:**
- `/` - Landing page (redirects to `/login` or dashboard based on auth)
- `/(main)/dashboard` - Main dashboard
- `/(main)/projects` - Projects list and detail views
- `/(main)/my-issues` - User's assigned issues
- `/(main)/time-tracking` - Time tracking overview
- `/(main)/maintenance` - Maintenance dashboard
- `/(main)/workspaces` - Workspace management

### Data Model Hierarchy

**Workspace → Projects → Issues**

1. **Workspace**: Top-level organization unit
   - Contains projects, issues, labels, statuses
   - Has members with roles (OWNER, ADMIN, MEMBER, GUEST)

2. **Project**: Groups related issues
   - Types: DEVELOPMENT or MAINTENANCE
   - Statuses: PLANNED, IN_PROGRESS, COMPLETED, CANCELED
   - Contains milestones and SLA configurations

3. **Issue**: Individual task/bug/feature
   - Has type (FEATURE, MAINTENANCE, BUG, IMPROVEMENT)
   - Priority levels (URGENT, HIGH, MEDIUM, LOW, NO_PRIORITY)
   - Linked to status, assignee, labels, milestone
   - Tracks time entries and SLA metrics

### Time Tracking System

- **Context**: `TimeTrackerContext` (`src/contexts/time-tracker-context.tsx`) provides global time tracking state
- Active time entries are tracked per issue with real-time elapsed time updates
- Users can have multiple concurrent timers running
- `FloatingTimer` component shows active timers in UI
- API endpoints: `POST /api/time-entries` (start), `PATCH /api/time-entries/[id]` (stop)

### Business Hours & SLA Tracking

**Business Hours** (`src/lib/business-hours.ts`):
- Monday-Friday, 9 AM - 6 PM (9 hours/day)
- All SLA calculations use business hours, not calendar time
- Functions: `calculateBusinessHours`, `checkSLAStatus`, `addBusinessHours`

**SLA Metrics** (tracked on Issue model):
- `reportedAt` - When issue was reported (editable, defaults to createdAt)
- `firstResponseAt` - Auto-set when moved to IN_PROGRESS status
- `resolvedAt` - Auto-set when moved to DONE status
- `resolutionTimeMinutes` - Business hours from reportedAt to resolvedAt
- `reopenCount` - Tracks how many times issue reopened after DONE

**SLA Configuration** (per project):
- Configure target times per issue type and priority combination
- `firstResponseTimeHours` - Hours until first response
- `resolutionTimeHours` - Hours until resolution
- Status colors: green (on-time), yellow (at-risk ≥80%), red (overdue ≥100%)

### Prisma Configuration

- Custom output path: `src/generated/prisma` (configured in `prisma/schema.prisma`)
- Import from: `@/generated/prisma` or `../src/generated/prisma`
- SQLite database with comprehensive indexes for performance

### UI Components

- **shadcn/ui** components in `src/components/ui/`
- Radix UI primitives with Tailwind CSS styling
- `@dnd-kit` for drag-and-drop functionality (issue reordering, milestone reordering)
- Lucide React for icons
- React Hook Form + Zod for form validation

## Important Patterns

### API Route Pattern

```typescript
import { withAuth, withCors } from "@/lib/api-auth";

export const GET = withAuth(async (req, userId) => {
  // userId is authenticated user from session or API key
  const response = NextResponse.json({ data });
  return withCors(response);
});
```

### API Authentication

The API supports two authentication methods:

1. **API Key (Bearer Token)** - For external integrations
   ```
   Authorization: Bearer <api-key>
   ```
   Configure in `.env`:
   ```env
   API_KEY="your-generated-key"
   API_KEY_USER_ID="user-id-for-api-requests"
   ```

2. **Session Cookie** - For browser-based requests
   ```
   Cookie: next-auth.session-token=<token>
   ```

The `withAuth` wrapper automatically handles both methods. API key is validated using SHA-256 hash comparison.

### Issue Status Changes

When updating issue status:
- Moving to IN_PROGRESS: Set `firstResponseAt` if not already set
- Moving to DONE: Set `resolvedAt` and calculate `resolutionTimeMinutes`
- Moving from DONE to non-DONE: Increment `reopenCount`, clear `resolvedAt`

### Client Components

Most UI components are client components (`"use client"`) due to:
- Interactive forms and modals
- Time tracker context consumption
- Real-time updates and state management

## Path Aliases

Use `@/` prefix for imports from `src/` directory:
```typescript
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
```
