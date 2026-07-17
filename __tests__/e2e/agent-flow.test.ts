import { describe, test, expect, inject } from 'vitest'

/**
 * E2E: fluxo completo de um agente externo operando a API via API key,
 * contra o servidor de produção real (standalone) e SQLite real.
 * Os testes rodam em sequência e compartilham estado (issue criada etc.).
 */

const e2e = inject('e2e')

interface IssueResponse {
  id: string
  title: string
  identifier: string
  statusId: string
  sortOrder: number
  firstResponseAt: string | null
  resolvedAt: string | null
  resolutionTimeMinutes: number | null
  reopenCount: number
  status: { id: string; type: string }
}

function api(pathname: string, init: RequestInit = {}, bearer: string | null = e2e.apiKey) {
  const headers = new Headers(init.headers)
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  return fetch(`${e2e.baseUrl}${pathname}`, { ...init, headers })
}

let issueId: string

describe('fluxo de agente via API key (e2e)', () => {
  test('1. GET /api/health sem auth → 200', async () => {
    const res = await api('/api/health', {}, null)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('healthy')
  })

  test('2. sem Authorization → 401 em issues, projects e PATCH', async () => {
    const issues = await api('/api/issues', {}, null)
    expect(issues.status).toBe(401)

    const projects = await api('/api/projects', {}, null)
    expect(projects.status).toBe(401)

    const patch = await api(
      '/api/issues/nao-existe',
      { method: 'PATCH', body: JSON.stringify({ title: 'x' }) },
      null
    )
    expect(patch.status).toBe(401)
  })

  test('3. Bearer errado → 401 com headers CORS', async () => {
    const res = await api('/api/issues', {}, 'chave-completamente-errada')
    expect(res.status).toBe(401)
    // Correção da revisão: os 401 do withAuth agora vêm com CORS.
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Invalid API key')
  })

  test('4. GET /api/workspaces e /api/projects com Bearer → 200 com dados do seed', async () => {
    const wsRes = await api('/api/workspaces')
    expect(wsRes.status).toBe(200)
    const workspaces = (await wsRes.json()) as Array<{ id: string; slug: string; role: string }>
    const ws = workspaces.find((w) => w.id === e2e.workspaceId)
    expect(ws).toBeDefined()
    expect(ws?.slug).toBe('e2e-workspace')
    expect(ws?.role).toBe('OWNER')

    const projRes = await api('/api/projects')
    expect(projRes.status).toBe(200)
    const projects = (await projRes.json()) as Array<{ id: string; name: string }>
    expect(projects.some((p) => p.id === e2e.projectId)).toBe(true)
  })

  test('5. POST /api/issues cria; GET lista; GET /api/issues/[id] lê', async () => {
    const createRes = await api('/api/issues', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Issue criada pelo agente e2e',
        description: 'Fluxo completo via API key',
        workspaceId: e2e.workspaceId,
        projectId: e2e.projectId,
        statusId: e2e.statusTodoId,
        priority: 'HIGH',
        type: 'FEATURE',
      }),
    })
    expect(createRes.status).toBe(201)
    const created = (await createRes.json()) as IssueResponse
    expect(created.id).toBeTruthy()
    issueId = created.id

    const listRes = await api(`/api/issues?workspaceId=${e2e.workspaceId}`)
    expect(listRes.status).toBe(200)
    const list = (await listRes.json()) as IssueResponse[]
    expect(list.some((i) => i.id === issueId)).toBe(true)

    const getRes = await api(`/api/issues/${issueId}`)
    expect(getRes.status).toBe(200)
    const fetched = (await getRes.json()) as IssueResponse
    expect(fetched.title).toBe('Issue criada pelo agente e2e')
  })

  test('6. GET /api/issues/[id]/time com Bearer → 200 (membership ok)', async () => {
    const res = await api(`/api/issues/${issueId}/time`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { totalSeconds: number; activeEntries: number }
    expect(body.totalSeconds).toBe(0)
    expect(body.activeEntries).toBe(0)
  })

  test('7. PATCH → IN_PROGRESS seta firstResponseAt', async () => {
    const res = await api(`/api/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId: e2e.statusInProgressId }),
    })
    expect(res.status).toBe(200)
    const updated = (await res.json()) as IssueResponse
    expect(updated.firstResponseAt).toBeTruthy()
    expect(updated.resolvedAt).toBeNull()
  })

  test('8. PATCH → DONE seta resolvedAt e resolutionTimeMinutes', async () => {
    const res = await api(`/api/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId: e2e.statusDoneId }),
    })
    expect(res.status).toBe(200)
    const updated = (await res.json()) as IssueResponse
    expect(updated.resolvedAt).toBeTruthy()
    expect(typeof updated.resolutionTimeMinutes).toBe('number')
    expect(updated.resolutionTimeMinutes as number).toBeGreaterThanOrEqual(0)
  })

  test('9. PATCH reabrir (DONE → TODO) incrementa reopenCount e limpa resolvedAt', async () => {
    const res = await api(`/api/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ statusId: e2e.statusTodoId }),
    })
    expect(res.status).toBe(200)
    const updated = (await res.json()) as IssueResponse
    expect(updated.reopenCount).toBe(1)
    expect(updated.resolvedAt).toBeNull()
    expect(updated.resolutionTimeMinutes).toBeNull()
  })

  test('10. POST /api/issues/bulk cria 3 issues', async () => {
    const res = await api('/api/issues/bulk', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: e2e.workspaceId,
        issues: [1, 2, 3].map((n) => ({
          title: `Issue bulk ${n}`,
          statusId: e2e.statusTodoId,
          projectId: e2e.projectId,
          type: 'MAINTENANCE',
        })),
      }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { success: boolean; count: number }
    expect(body.success).toBe(true)
    expect(body.count).toBe(3)
  })

  test('11. POST /api/issues/reorder persiste a nova ordem', async () => {
    const before = await api(`/api/issues?workspaceId=${e2e.workspaceId}&status=TODO`)
    expect(before.status).toBe(200)
    const todoIssues = (await before.json()) as IssueResponse[]
    // Issue reaberta + 3 do bulk
    expect(todoIssues.length).toBe(4)

    const reversedIds = todoIssues.map((i) => i.id).reverse()

    const reorderRes = await api('/api/issues/reorder', {
      method: 'POST',
      body: JSON.stringify({
        issueId: reversedIds[0],
        statusType: 'TODO',
        sortedIssueIds: reversedIds,
      }),
    })
    expect(reorderRes.status).toBe(200)
    const reorderBody = (await reorderRes.json()) as { success: boolean }
    expect(reorderBody.success).toBe(true)

    const after = await api(`/api/issues?workspaceId=${e2e.workspaceId}&status=TODO`)
    const reordered = (await after.json()) as IssueResponse[]
    expect(reordered.map((i) => i.id)).toEqual(reversedIds)
  })

  test('12. POST /api/generate-token não existe mais (404/405)', async () => {
    const res = await api('/api/generate-token', {
      method: 'POST',
      body: JSON.stringify({ email: 'dummy@example.test', password: 'dummy-not-a-real-password' }),
    })
    expect([404, 405]).toContain(res.status)
  })

  test('13. preflight OPTIONS /api/issues → 2xx com headers CORS', async () => {
    const res = await api('/api/issues', { method: 'OPTIONS' }, null)
    expect(res.status).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(300)
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
    expect(res.headers.get('access-control-allow-methods')).toContain('PATCH')
    expect(res.headers.get('access-control-allow-headers')).toContain('Authorization')
  })
})
