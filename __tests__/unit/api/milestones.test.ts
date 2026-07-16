import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listMilestones, POST as createMilestone } from '@/app/api/milestones/route';
import {
  GET as getMilestone,
  PATCH as patchMilestone,
  DELETE as deleteMilestone,
} from '@/app/api/milestones/[id]/route';
import { POST as reorderMilestones } from '@/app/api/milestones/reorder/route';
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

const projectWithMember = {
  id: 'project-1',
  workspaceId: 'ws-1',
  workspace: { id: 'ws-1', members: [{ id: 'member-1' }] },
};

const milestoneWithAccess = {
  id: 'milestone-1',
  name: 'M1',
  projectId: 'project-1',
  project: {
    id: 'project-1',
    workspaceId: 'ws-1',
    workspace: { id: 'ws-1', members: [{ id: 'member-1' }] },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/milestones', () => {
  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(projectWithMember as never);
    vi.mocked(prisma.milestone.findMany).mockResolvedValue([] as never);
  }

  test('Bearer válido → 200 e filtra membership pelo userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/milestones?projectId=project-1',
      { headers: bearerHeaders() }
    );
    const response = await listMilestones(req);

    expect(response.status).toBe(200);
    expect(prisma.project.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          workspace: expect.objectContaining({
            include: expect.objectContaining({
              members: { where: { userId: API_USER_ID } },
            }),
          }),
        }),
      })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/milestones?projectId=project-1'
    );
    const response = await listMilestones(req);

    expect(response.status).toBe(401);
    expect(prisma.milestone.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/milestones?projectId=project-1'
    );
    const response = await listMilestones(req);

    expect(response.status).toBe(200);
  });

  test('sem projectId → 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/milestones', {
      headers: bearerHeaders(),
    });
    const response = await listMilestones(req);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/milestones', () => {
  const body = { name: 'Nova milestone', projectId: 'project-1' };

  function milestoneRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/milestones', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(projectWithMember as never);
    vi.mocked(prisma.milestone.create).mockResolvedValue({
      id: 'milestone-new',
      name: 'Nova milestone',
    } as never);
  }

  test('Bearer válido → 201 e cria', async () => {
    mockHappyPath();

    const response = await createMilestone(milestoneRequest());

    expect(response.status).toBe(201);
    expect(prisma.milestone.create).toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await createMilestone(milestoneRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.milestone.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await createMilestone(milestoneRequest(false));

    expect(response.status).toBe(201);
  });
});

describe('GET /api/milestones/[id]', () => {
  test('Bearer válido → 200', async () => {
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue(
      milestoneWithAccess as never
    );

    const req = new NextRequest('http://localhost:3000/api/milestones/milestone-1', {
      headers: bearerHeaders(),
    });
    const response = await getMilestone(req, ctxFor('milestone-1'));

    expect(response.status).toBe(200);
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/milestones/milestone-1');
    const response = await getMilestone(req, ctxFor('milestone-1'));

    expect(response.status).toBe(401);
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue(
      milestoneWithAccess as never
    );

    const req = new NextRequest('http://localhost:3000/api/milestones/milestone-1');
    const response = await getMilestone(req, ctxFor('milestone-1'));

    expect(response.status).toBe(200);
  });

  test('milestone inexistente → 404', async () => {
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest('http://localhost:3000/api/milestones/nope', {
      headers: bearerHeaders(),
    });
    const response = await getMilestone(req, ctxFor('nope'));

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/milestones/[id]', () => {
  function patchRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/milestones/milestone-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renomeada' }),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue(
      milestoneWithAccess as never
    );
    vi.mocked(prisma.milestone.update).mockResolvedValue({
      ...milestoneWithAccess,
      name: 'Renomeada',
    } as never);
  }

  test('Bearer válido → 200 e atualiza', async () => {
    mockHappyPath();

    const response = await patchMilestone(patchRequest(), ctxFor('milestone-1'));

    expect(response.status).toBe(200);
    expect(prisma.milestone.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'milestone-1' } })
    );
  });

  test('sem credencial → 401', async () => {
    const response = await patchMilestone(patchRequest(false), ctxFor('milestone-1'));

    expect(response.status).toBe(401);
    expect(prisma.milestone.update).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await patchMilestone(patchRequest(false), ctxFor('milestone-1'));

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/milestones/[id]', () => {
  function deleteRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/milestones/milestone-1', {
      method: 'DELETE',
      headers: useBearer ? bearerHeaders() : undefined,
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue(
      milestoneWithAccess as never
    );
    vi.mocked(prisma.milestone.delete).mockResolvedValue(
      milestoneWithAccess as never
    );
  }

  test('Bearer válido → 200 e deleta', async () => {
    mockHappyPath();

    const response = await deleteMilestone(deleteRequest(), ctxFor('milestone-1'));

    expect(response.status).toBe(200);
    expect(prisma.milestone.delete).toHaveBeenCalledWith({
      where: { id: 'milestone-1' },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await deleteMilestone(deleteRequest(false), ctxFor('milestone-1'));

    expect(response.status).toBe(401);
    expect(prisma.milestone.delete).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await deleteMilestone(deleteRequest(false), ctxFor('milestone-1'));

    expect(response.status).toBe(200);
  });
});

describe('POST /api/milestones/reorder', () => {
  const body = {
    milestoneId: 'milestone-1',
    sortedMilestoneIds: ['milestone-2', 'milestone-1'],
  };

  function reorderRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/milestones/reorder', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.milestone.findUnique).mockResolvedValue({
      id: 'milestone-1',
      project: { id: 'project-1', workspaceId: 'ws-1' },
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  }

  test('Bearer válido → 200 e reordena', async () => {
    mockHappyPath();

    const response = await reorderMilestones(reorderRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await reorderMilestones(reorderRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await reorderMilestones(reorderRequest(false));

    expect(response.status).toBe(200);
  });
});
