import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listIssues } from '@/app/api/issues/route';
import {
  GET as getIssue,
  PATCH as patchIssue,
  DELETE as deleteIssue,
} from '@/app/api/issues/[id]/route';
import { POST as reorderIssues } from '@/app/api/issues/reorder/route';
import { GET as getIssueTime } from '@/app/api/issues/[id]/time/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

const API_KEY = 'test-api-key';
const API_USER_ID = 'api-key-user-id';
const SESSION_USER_ID = 'session-user-id';

function bearerHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${API_KEY}`, ...extra };
}

function mockSession(userId = SESSION_USER_ID) {
  mockAuth.mockResolvedValue({
    user: { id: userId, email: 'user@example.com' },
    expires: new Date().toISOString(),
  });
}

function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

const baseIssue = {
  id: 'issue-1',
  workspaceId: 'ws-1',
  statusId: 'status-todo',
  identifier: '1',
  reopenCount: 0,
  firstResponseAt: null as Date | null,
  resolvedAt: null as Date | null,
  resolutionTimeMinutes: null as number | null,
  reportedAt: null as Date | null,
  createdAt: new Date('2026-07-13T12:00:00.000Z'),
  status: { id: 'status-todo', type: 'TODO' },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/issues', () => {
  function mockHappyPath() {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
      { workspaceId: 'ws-1' },
    ] as never);
    vi.mocked(prisma.issue.findMany).mockResolvedValue([
      { id: 'issue-1', title: 'Issue 1' },
    ] as never);
  }

  test('Bearer válido → 200 e usa o userId da API key na query', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues', {
      headers: bearerHeaders(),
    });
    const response = await listIssues(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: API_USER_ID } })
    );
    expect(mockAuth).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/issues');
    const response = await listIssues(req);

    expect(response.status).toBe(401);
    expect(prisma.issue.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues');
    const response = await listIssues(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: SESSION_USER_ID } })
    );
  });

  test('filtros de query string continuam aplicados', async () => {
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/issues?workspaceId=ws-1&priority=HIGH',
      { headers: bearerHeaders() }
    );
    const response = await listIssues(req);

    expect(response.status).toBe(200);
    expect(prisma.issue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'ws-1', priority: 'HIGH' }),
      })
    );
  });
});

describe('GET /api/issues/[id]', () => {
  function mockHappyPath() {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ ...baseIssue } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
  }

  test('Bearer válido → 200 e checa acesso com o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1', {
      headers: bearerHeaders(),
    });
    const response = await getIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/issues/issue-1');
    const response = await getIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(401);
    expect(prisma.issue.findUnique).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1');
    const response = await getIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: SESSION_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('issue inexistente → 404', async () => {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest('http://localhost:3000/api/issues/nope', {
      headers: bearerHeaders(),
    });
    const response = await getIssue(req, ctxFor('nope'));

    expect(response.status).toBe(404);
  });

  test('sem acesso ao workspace → 403', async () => {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ ...baseIssue } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1', {
      headers: bearerHeaders(),
    });
    const response = await getIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/issues/[id]', () => {
  function patchRequest(body: Record<string, unknown>, useBearer = true) {
    return new NextRequest('http://localhost:3000/api/issues/issue-1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockUpdateChain(issue: Record<string, unknown>, newStatus: Record<string, unknown> | null) {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue(issue as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.status.findUnique).mockResolvedValue(newStatus as never);
    vi.mocked(prisma.issue.update).mockResolvedValue({
      ...issue,
      statusId: (newStatus as { id?: string } | null)?.id ?? issue.statusId,
    } as never);
  }

  function updateData(): Record<string, unknown> {
    return vi.mocked(prisma.issue.update).mock.calls[0][0]
      .data as Record<string, unknown>;
  }

  test('Bearer válido → 200 e checa acesso com o userId da API key', async () => {
    mockUpdateChain({ ...baseIssue }, null);

    const response = await patchIssue(patchRequest({ title: 'Novo título' }), ctxFor('issue-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await patchIssue(
      patchRequest({ title: 'x' }, false),
      ctxFor('issue-1')
    );

    expect(response.status).toBe(401);
    expect(prisma.issue.update).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockUpdateChain({ ...baseIssue }, null);

    const response = await patchIssue(
      patchRequest({ title: 'Novo título' }, false),
      ctxFor('issue-1')
    );

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: SESSION_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  // Cobertos via sessão ANTES do refactor para withAuth: provam que a
  // migração não altera os side effects de SLA.
  describe('side effects de SLA', () => {
    beforeEach(() => {
      mockSession();
    });

    test('mover para IN_PROGRESS pela 1ª vez seta firstResponseAt', async () => {
      mockUpdateChain(
        { ...baseIssue },
        { id: 'status-progress', type: 'IN_PROGRESS' }
      );

      const response = await patchIssue(
        patchRequest({ statusId: 'status-progress' }, false),
        ctxFor('issue-1')
      );

      expect(response.status).toBe(200);
      expect(updateData().firstResponseAt).toBeInstanceOf(Date);
    });

    test('mover para IN_PROGRESS de novo NÃO sobrescreve firstResponseAt', async () => {
      mockUpdateChain(
        { ...baseIssue, firstResponseAt: new Date('2026-07-14T13:00:00.000Z') },
        { id: 'status-progress', type: 'IN_PROGRESS' }
      );

      await patchIssue(
        patchRequest({ statusId: 'status-progress' }, false),
        ctxFor('issue-1')
      );

      expect(updateData()).not.toHaveProperty('firstResponseAt');
    });

    test('mover para DONE seta resolvedAt e calcula resolutionTimeMinutes em horas úteis', async () => {
      mockUpdateChain(
        {
          ...baseIssue,
          statusId: 'status-progress',
          status: { id: 'status-progress', type: 'IN_PROGRESS' },
          reportedAt: new Date('2026-07-13T12:00:00.000Z'),
        },
        { id: 'status-done', type: 'DONE' }
      );

      const response = await patchIssue(
        patchRequest({ statusId: 'status-done' }, false),
        ctxFor('issue-1')
      );

      expect(response.status).toBe(200);
      const data = updateData();
      expect(data.resolvedAt).toBeInstanceOf(Date);
      expect(typeof data.resolutionTimeMinutes).toBe('number');
      expect(data.resolutionTimeMinutes as number).toBeGreaterThanOrEqual(0);
    });

    test('reabrir (DONE → não-DONE) incrementa reopenCount e limpa resolvedAt', async () => {
      mockUpdateChain(
        {
          ...baseIssue,
          statusId: 'status-done',
          status: { id: 'status-done', type: 'DONE' },
          resolvedAt: new Date('2026-07-15T15:00:00.000Z'),
          resolutionTimeMinutes: 540,
          reopenCount: 0,
        },
        { id: 'status-todo', type: 'TODO' }
      );

      await patchIssue(
        patchRequest({ statusId: 'status-todo' }, false),
        ctxFor('issue-1')
      );

      const data = updateData();
      expect(data.reopenCount).toBe(1);
      expect(data.resolvedAt).toBeNull();
      expect(data.resolutionTimeMinutes).toBeNull();
    });
  });
});

describe('DELETE /api/issues/[id]', () => {
  function mockHappyPath() {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ ...baseIssue } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.issue.delete).mockResolvedValue({ ...baseIssue } as never);
  }

  test('Bearer válido → 200 e deleta', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1', {
      method: 'DELETE',
      headers: bearerHeaders(),
    });
    const response = await deleteIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(200);
    expect(prisma.issue.delete).toHaveBeenCalledWith({ where: { id: 'issue-1' } });
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/issues/issue-1', {
      method: 'DELETE',
    });
    const response = await deleteIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(401);
    expect(prisma.issue.delete).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1', {
      method: 'DELETE',
    });
    const response = await deleteIssue(req, ctxFor('issue-1'));

    expect(response.status).toBe(200);
  });
});

describe('POST /api/issues/reorder', () => {
  const reorderBody = {
    issueId: 'issue-1',
    statusType: 'TODO',
    sortedIssueIds: ['issue-2', 'issue-1'],
  };

  function reorderRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/issues/reorder', {
      method: 'POST',
      body: JSON.stringify(reorderBody),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({ ...baseIssue } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  }

  test('Bearer válido → 200 e reordena', async () => {
    mockHappyPath();

    const response = await reorderIssues(reorderRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await reorderIssues(reorderRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await reorderIssues(reorderRequest(false));

    expect(response.status).toBe(200);
  });

  test('status type divergente → 400', async () => {
    vi.mocked(prisma.issue.findUnique).mockResolvedValue({
      ...baseIssue,
      status: { id: 'status-done', type: 'DONE' },
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);

    const response = await reorderIssues(reorderRequest());

    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('GET /api/issues/[id]/time', () => {
  function mockHappyPath() {
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValue([
      {
        duration: 60,
        endTime: new Date('2026-07-15T13:00:00.000Z'),
        startTime: new Date('2026-07-15T12:00:00.000Z'),
      },
    ] as never);
  }

  test('Bearer válido → 200 com total de tempo', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1/time', {
      headers: bearerHeaders(),
    });
    const response = await getIssueTime(req, ctxFor('issue-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalSeconds).toBe(60);
    expect(data.completedEntries).toBe(1);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { issueId: 'issue-1' } })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/issues/issue-1/time');
    const response = await getIssueTime(req, ctxFor('issue-1'));

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/issues/issue-1/time');
    const response = await getIssueTime(req, ctxFor('issue-1'));

    expect(response.status).toBe(200);
  });
});
