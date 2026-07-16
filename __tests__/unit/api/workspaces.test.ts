import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listWorkspaces, POST as createWorkspace } from '@/app/api/workspaces/route';
import {
  GET as getWorkspace,
  PATCH as patchWorkspace,
  DELETE as deleteWorkspace,
} from '@/app/api/workspaces/[id]/route';
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/workspaces', () => {
  function mockHappyPath() {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
      {
        role: 'OWNER',
        workspace: { id: 'ws-1', name: 'WS', _count: { members: 1, projects: 2 } },
      },
    ] as never);
  }

  test('Bearer válido → 200 e usa o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/workspaces', {
      headers: bearerHeaders(),
    });
    const response = await listWorkspaces(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].role).toBe('OWNER');
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: API_USER_ID } })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/workspaces');
    const response = await listWorkspaces(req);

    expect(response.status).toBe(401);
    expect(prisma.workspaceMember.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/workspaces');
    const response = await listWorkspaces(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: SESSION_USER_ID } })
    );
  });
});

describe('POST /api/workspaces', () => {
  const body = { name: 'Novo WS', slug: 'novo-ws' };

  function workspaceRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.workspace.create).mockResolvedValue({
      id: 'ws-new',
      name: 'Novo WS',
      slug: 'novo-ws',
    } as never);
    vi.mocked(prisma.status.createMany).mockResolvedValue({ count: 5 } as never);
  }

  test('Bearer válido → 201 e cria com o userId da API key como OWNER', async () => {
    mockHappyPath();

    const response = await createWorkspace(workspaceRequest());

    expect(response.status).toBe(201);
    expect(prisma.workspace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: {
            create: { userId: API_USER_ID, role: 'OWNER' },
          },
        }),
      })
    );
    expect(prisma.status.createMany).toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await createWorkspace(workspaceRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.workspace.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await createWorkspace(workspaceRequest(false));

    expect(response.status).toBe(201);
    expect(prisma.workspace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: {
            create: { userId: SESSION_USER_ID, role: 'OWNER' },
          },
        }),
      })
    );
  });
});

describe('GET /api/workspaces/[id]', () => {
  function mockHappyPath(memberUserId = API_USER_ID) {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      id: 'ws-1',
      name: 'WS',
      members: [{ userId: memberUserId, role: 'MEMBER', user: {} }],
      _count: { projects: 1, issues: 2 },
    } as never);
  }

  test('Bearer válido → 200 com userRole do membro da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/workspaces/ws-1', {
      headers: bearerHeaders(),
    });
    const response = await getWorkspace(req, ctxFor('ws-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userRole).toBe('MEMBER');
  });

  test('Bearer válido mas não é membro → 403', async () => {
    mockHappyPath('outro-user');

    const req = new NextRequest('http://localhost:3000/api/workspaces/ws-1', {
      headers: bearerHeaders(),
    });
    const response = await getWorkspace(req, ctxFor('ws-1'));

    expect(response.status).toBe(403);
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/workspaces/ws-1');
    const response = await getWorkspace(req, ctxFor('ws-1'));

    expect(response.status).toBe(401);
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath(SESSION_USER_ID);

    const req = new NextRequest('http://localhost:3000/api/workspaces/ws-1');
    const response = await getWorkspace(req, ctxFor('ws-1'));

    expect(response.status).toBe(200);
  });
});

describe('PATCH /api/workspaces/[id]', () => {
  function patchRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/workspaces/ws-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renomeado' }),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath(role = 'ADMIN') {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
      role,
    } as never);
    vi.mocked(prisma.workspace.update).mockResolvedValue({
      id: 'ws-1',
      name: 'Renomeado',
    } as never);
  }

  test('Bearer válido (ADMIN) → 200 e checa membership do userId da API key', async () => {
    mockHappyPath();

    const response = await patchWorkspace(patchRequest(), ctxFor('ws-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('Bearer válido mas role MEMBER → 403 (regra pós-auth preservada)', async () => {
    mockHappyPath('MEMBER');

    const response = await patchWorkspace(patchRequest(), ctxFor('ws-1'));

    expect(response.status).toBe(403);
    expect(prisma.workspace.update).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await patchWorkspace(patchRequest(false), ctxFor('ws-1'));

    expect(response.status).toBe(401);
    expect(prisma.workspace.update).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await patchWorkspace(patchRequest(false), ctxFor('ws-1'));

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/workspaces/[id]', () => {
  function deleteRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/workspaces/ws-1', {
      method: 'DELETE',
      headers: useBearer ? bearerHeaders() : undefined,
    });
  }

  function mockHappyPath(role = 'OWNER') {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
      role,
    } as never);
    vi.mocked(prisma.workspace.delete).mockResolvedValue({ id: 'ws-1' } as never);
  }

  test('Bearer válido (OWNER) → 200 e deleta', async () => {
    mockHappyPath();

    const response = await deleteWorkspace(deleteRequest(), ctxFor('ws-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: 'ws-1' } });
  });

  test('Bearer válido mas role ADMIN → 403 (só OWNER deleta)', async () => {
    mockHappyPath('ADMIN');

    const response = await deleteWorkspace(deleteRequest(), ctxFor('ws-1'));

    expect(response.status).toBe(403);
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await deleteWorkspace(deleteRequest(false), ctxFor('ws-1'));

    expect(response.status).toBe(401);
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await deleteWorkspace(deleteRequest(false), ctxFor('ws-1'));

    expect(response.status).toBe(200);
  });
});
