import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listProjects, POST as createProject } from '@/app/api/projects/route';
import {
  GET as getProject,
  PATCH as patchProject,
  DELETE as deleteProject,
} from '@/app/api/projects/[id]/route';
import { POST as reorderProjects } from '@/app/api/projects/reorder/route';
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

const baseProject = {
  id: 'project-1',
  name: 'Project 1',
  workspaceId: 'ws-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/projects', () => {
  function mockHappyPath() {
    vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
      { workspaceId: 'ws-1' },
    ] as never);
    vi.mocked(prisma.project.findMany).mockResolvedValue([baseProject] as never);
  }

  test('Bearer válido → 200 e usa o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/projects', {
      headers: bearerHeaders(),
    });
    const response = await listProjects(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: API_USER_ID } })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects');
    const response = await listProjects(req);

    expect(response.status).toBe(401);
    expect(prisma.project.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/projects');
    const response = await listProjects(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: SESSION_USER_ID } })
    );
  });
});

describe('POST /api/projects', () => {
  const body = { name: 'Novo projeto', workspaceId: 'ws-1' };

  function projectRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.project.aggregate).mockResolvedValue({
      _max: { sortOrder: 2 },
    } as never);
    vi.mocked(prisma.project.create).mockResolvedValue(baseProject as never);
  }

  test('Bearer válido → 201 e checa acesso com o userId da API key', async () => {
    mockHappyPath();

    const response = await createProject(projectRequest());

    expect(response.status).toBe(201);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sortOrder: 3 }),
      })
    );
  });

  test('sem credencial → 401', async () => {
    const response = await createProject(projectRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await createProject(projectRequest(false));

    expect(response.status).toBe(201);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: SESSION_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });
});

describe('GET /api/projects/[id]', () => {
  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
  }

  test('Bearer válido → 200 e checa acesso com o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/projects/project-1', {
      headers: bearerHeaders(),
    });
    const response = await getProject(req, ctxFor('project-1'));

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/project-1');
    const response = await getProject(req, ctxFor('project-1'));

    expect(response.status).toBe(401);
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/projects/project-1');
    const response = await getProject(req, ctxFor('project-1'));

    expect(response.status).toBe(200);
  });

  test('projeto inexistente → 404', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest('http://localhost:3000/api/projects/nope', {
      headers: bearerHeaders(),
    });
    const response = await getProject(req, ctxFor('nope'));

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/projects/[id]', () => {
  function patchRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/projects/project-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renomeado' }),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.project.update).mockResolvedValue({
      ...baseProject,
      name: 'Renomeado',
    } as never);
  }

  test('Bearer válido → 200 e atualiza', async () => {
    mockHappyPath();

    const response = await patchProject(patchRequest(), ctxFor('project-1'));

    expect(response.status).toBe(200);
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'project-1' } })
    );
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await patchProject(patchRequest(false), ctxFor('project-1'));

    expect(response.status).toBe(401);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await patchProject(patchRequest(false), ctxFor('project-1'));

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/projects/[id]', () => {
  function deleteRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/projects/project-1', {
      method: 'DELETE',
      headers: useBearer ? bearerHeaders() : undefined,
    });
  }

  function mockHappyPath(role = 'OWNER') {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
      role,
    } as never);
    vi.mocked(prisma.project.delete).mockResolvedValue(baseProject as never);
  }

  test('Bearer válido (OWNER) → 200 e deleta', async () => {
    mockHappyPath();

    const response = await deleteProject(deleteRequest(), ctxFor('project-1'));

    expect(response.status).toBe(200);
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'project-1' } });
  });

  test('Bearer válido mas role MEMBER → 403 (regra pós-auth preservada)', async () => {
    mockHappyPath('MEMBER');

    const response = await deleteProject(deleteRequest(), ctxFor('project-1'));

    expect(response.status).toBe(403);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await deleteProject(deleteRequest(false), ctxFor('project-1'));

    expect(response.status).toBe(401);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await deleteProject(deleteRequest(false), ctxFor('project-1'));

    expect(response.status).toBe(200);
  });
});

describe('POST /api/projects/reorder', () => {
  const body = { projectId: 'project-1', sortedProjectIds: ['project-2', 'project-1'] };

  function reorderRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/projects/reorder', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseProject as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  }

  test('Bearer válido → 200 e reordena', async () => {
    mockHappyPath();

    const response = await reorderProjects(reorderRequest());
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
    const response = await reorderProjects(reorderRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await reorderProjects(reorderRequest(false));

    expect(response.status).toBe(200);
  });
});
