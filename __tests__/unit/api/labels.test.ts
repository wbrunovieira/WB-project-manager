import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listLabels, POST as createLabel } from '@/app/api/labels/route';
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

describe('GET /api/labels', () => {
  function mockHappyPath() {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
      id: 'member-1',
    } as never);
    vi.mocked(prisma.label.findMany).mockResolvedValue([
      { id: 'label-1', name: 'bug', color: '#FF0000' },
    ] as never);
  }

  test('Bearer válido → 200 e checa acesso com o userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/labels?workspaceId=ws-1', {
      headers: bearerHeaders(),
    });
    const response = await listLabels(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: API_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/labels?workspaceId=ws-1');
    const response = await listLabels(req);

    expect(response.status).toBe(401);
    expect(prisma.label.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/labels?workspaceId=ws-1');
    const response = await listLabels(req);

    expect(response.status).toBe(200);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: { userId: SESSION_USER_ID, workspaceId: 'ws-1' },
      },
    });
  });

  test('sem workspaceId → 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/labels', {
      headers: bearerHeaders(),
    });
    const response = await listLabels(req);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/labels', () => {
  const body = { name: 'bug', color: '#FF0000', workspaceId: 'ws-1' };

  function labelRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/labels', {
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
    vi.mocked(prisma.label.create).mockResolvedValue({
      id: 'label-new',
      ...body,
    } as never);
  }

  test('Bearer válido → 201 e cria', async () => {
    mockHappyPath();

    const response = await createLabel(labelRequest());

    expect(response.status).toBe(201);
    expect(prisma.label.create).toHaveBeenCalledWith({
      data: { name: 'bug', color: '#FF0000', workspaceId: 'ws-1' },
    });
  });

  test('sem credencial → 401', async () => {
    const response = await createLabel(labelRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.label.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await createLabel(labelRequest(false));

    expect(response.status).toBe(201);
  });

  test('Bearer válido sem acesso ao workspace → 403', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null as never);

    const response = await createLabel(labelRequest());

    expect(response.status).toBe(403);
    expect(prisma.label.create).not.toHaveBeenCalled();
  });
});
