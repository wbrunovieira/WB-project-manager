import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as listTimeEntries, POST as startTimeEntry } from '@/app/api/time-entries/route';
import {
  PATCH as stopTimeEntry,
  DELETE as deleteTimeEntry,
} from '@/app/api/time-entries/[id]/route';
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

const issueInclude = {
  issue: { id: 'issue-1', project: null, status: {}, milestone: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('POST /api/time-entries', () => {
  const body = { issueId: 'issue-1', description: 'trabalhando' };

  function startRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/time-entries', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath() {
    vi.mocked(prisma.timeEntry.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.timeEntry.create).mockResolvedValue({
      id: 'entry-1',
      issueId: 'issue-1',
      userId: API_USER_ID,
      ...issueInclude,
    } as never);
  }

  test('Bearer válido → 200 e cria entry para o userId da API key', async () => {
    mockHappyPath();

    const response = await startTimeEntry(startRequest());

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.findFirst).toHaveBeenCalledWith({
      where: { userId: API_USER_ID, issueId: 'issue-1', endTime: null },
    });
    expect(prisma.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: API_USER_ID, issueId: 'issue-1' }),
      })
    );
  });

  test('sem credencial → 401', async () => {
    const response = await startTimeEntry(startRequest(false));

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.create).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const response = await startTimeEntry(startRequest(false));

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: SESSION_USER_ID }),
      })
    );
  });

  test('timer já ativo para a issue → 400', async () => {
    vi.mocked(prisma.timeEntry.findFirst).mockResolvedValue({
      id: 'entry-existente',
    } as never);

    const response = await startTimeEntry(startRequest());

    expect(response.status).toBe(400);
    expect(prisma.timeEntry.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/time-entries', () => {
  function mockHappyPath() {
    vi.mocked(prisma.timeEntry.findMany).mockResolvedValue([
      { id: 'entry-1', ...issueInclude },
    ] as never);
  }

  test('Bearer válido → 200 e lista entries ativas do userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/time-entries', {
      headers: bearerHeaders(),
    });
    const response = await listTimeEntries(req);

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: API_USER_ID, endTime: null },
      })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/time-entries');
    const response = await listTimeEntries(req);

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/time-entries');
    const response = await listTimeEntries(req);

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: SESSION_USER_ID, endTime: null },
      })
    );
  });
});

describe('PATCH /api/time-entries/[id]', () => {
  function stopRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/time-entries/entry-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: useBearer
        ? bearerHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' },
    });
  }

  function mockHappyPath(ownerId = API_USER_ID) {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValue({
      id: 'entry-1',
      userId: ownerId,
      startTime: new Date(Date.now() - 60_000),
      endTime: null,
      duration: 0,
    } as never);
    vi.mocked(prisma.timeEntry.update).mockResolvedValue({
      id: 'entry-1',
      ...issueInclude,
    } as never);
  }

  test('Bearer válido → 200, para o timer do dono (userId da API key)', async () => {
    mockHappyPath();

    const response = await stopTimeEntry(stopRequest(), ctxFor('entry-1'));

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'entry-1' },
        data: expect.objectContaining({ endTime: expect.any(Date) }),
      })
    );
  });

  test('Bearer válido mas entry de outro usuário → 403', async () => {
    mockHappyPath('outro-user');

    const response = await stopTimeEntry(stopRequest(), ctxFor('entry-1'));

    expect(response.status).toBe(403);
    expect(prisma.timeEntry.update).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await stopTimeEntry(stopRequest(false), ctxFor('entry-1'));

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.update).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath(SESSION_USER_ID);

    const response = await stopTimeEntry(stopRequest(false), ctxFor('entry-1'));

    expect(response.status).toBe(200);
  });

  test('entry já parada → 400', async () => {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValue({
      id: 'entry-1',
      userId: API_USER_ID,
      startTime: new Date(Date.now() - 60_000),
      endTime: new Date(),
      duration: 60,
    } as never);

    const response = await stopTimeEntry(stopRequest(), ctxFor('entry-1'));

    expect(response.status).toBe(400);
    expect(prisma.timeEntry.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/time-entries/[id]', () => {
  function deleteRequest(useBearer = true) {
    return new NextRequest('http://localhost:3000/api/time-entries/entry-1', {
      method: 'DELETE',
      headers: useBearer ? bearerHeaders() : undefined,
    });
  }

  function mockHappyPath(ownerId = API_USER_ID) {
    vi.mocked(prisma.timeEntry.findUnique).mockResolvedValue({
      id: 'entry-1',
      userId: ownerId,
    } as never);
    vi.mocked(prisma.timeEntry.delete).mockResolvedValue({ id: 'entry-1' } as never);
  }

  test('Bearer válido → 200 e deleta entry do dono', async () => {
    mockHappyPath();

    const response = await deleteTimeEntry(deleteRequest(), ctxFor('entry-1'));

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
  });

  test('Bearer válido mas entry de outro usuário → 403', async () => {
    mockHappyPath('outro-user');

    const response = await deleteTimeEntry(deleteRequest(), ctxFor('entry-1'));

    expect(response.status).toBe(403);
    expect(prisma.timeEntry.delete).not.toHaveBeenCalled();
  });

  test('sem credencial → 401', async () => {
    const response = await deleteTimeEntry(deleteRequest(false), ctxFor('entry-1'));

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.delete).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath(SESSION_USER_ID);

    const response = await deleteTimeEntry(deleteRequest(false), ctxFor('entry-1'));

    expect(response.status).toBe(200);
  });
});
