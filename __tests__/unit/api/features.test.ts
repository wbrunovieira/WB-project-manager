import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listFeatures, POST as createFeature } from '@/app/api/features/route';
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/features', () => {
  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.feature.findMany).mockResolvedValue([
      { id: 'feature-1', name: 'Checkout' },
    ] as never);
  }

  test('Bearer válido → 200 e checa acesso com o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/features?projectId=project-1',
      { headers: bearerHeaders() }
    );
    const response = await listFeatures(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/features?projectId=project-1'
    );
    const response = await listFeatures(req);

    expect(response.status).toBe(401);
    expect(prisma.feature.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/features?projectId=project-1'
    );
    const response = await listFeatures(req);

    expect(response.status).toBe(200);
  });

  test('projeto inexistente → 404', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);

    const req = new NextRequest('http://localhost:3000/api/features?projectId=nope', {
      headers: bearerHeaders(),
    });
    const response = await listFeatures(req);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/features', () => {
  const body = { name: 'Checkout', projectId: 'project-1' };

  function featureRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/features', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.feature.create).mockResolvedValue({
      id: 'feature-new',
      ...body,
    } as never);
  }

  test('Bearer válido → 201 e cria', async () => {
    mockHappyPath();

    const response = await createFeature(featureRequest());

    expect(response.status).toBe(201);
    expect(prisma.feature.create).toHaveBeenCalledWith({
      data: { name: 'Checkout', projectId: 'project-1' },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await createFeature(featureRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.feature.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await createFeature(featureRequest(false));

    expect(response.status).toBe(201);
  });

  test('Bearer válido sem acesso ao projeto → 403', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      workspaceId: 'ws-1',
    } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null as never);

    const response = await createFeature(featureRequest());

    expect(response.status).toBe(403);
    expect(prisma.feature.create).not.toHaveBeenCalled();
  });
});
