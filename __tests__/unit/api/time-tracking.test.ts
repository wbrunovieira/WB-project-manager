import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as getTimeTracking } from '@/app/api/time-tracking/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

const API_KEY = 'test-api-key';
const API_USER_ID = 'api-key-user-id';
const SESSION_USER_ID = 'session-user-id';

function bearerHeaders() {
  return { Authorization: `Bearer ${API_KEY}` };
}

function mockSession(userId = SESSION_USER_ID) {
  mockAuth.mockResolvedValue({
    user: { id: userId, email: 'user@example.com' },
    expires: new Date().toISOString(),
  });
}

function mockHappyPath() {
  vi.mocked(prisma.timeEntry.findMany).mockResolvedValue([
    {
      id: 'entry-1',
      duration: 120,
      startTime: new Date('2026-07-15T12:00:00.000Z'),
      endTime: new Date('2026-07-15T12:02:00.000Z'),
      issue: { id: 'issue-1', project: null, status: {}, milestone: null, labels: [] },
    },
  ] as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_KEY = API_KEY;
  process.env.API_KEY_USER_ID = API_USER_ID;
  mockAuth.mockResolvedValue(null);
});

describe('GET /api/time-tracking', () => {
  test('Bearer válido → 200 e filtra pelo userId da API key', async () => {
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/time-tracking', {
      headers: bearerHeaders(),
    });
    const response = await getTimeTracking(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalSeconds).toBe(120);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: API_USER_ID }),
      })
    );
  });

  test('filtro por milestone continua aplicado', async () => {
    mockHappyPath();

    const req = new NextRequest(
      'http://localhost:3000/api/time-tracking?milestoneId=m-1',
      { headers: bearerHeaders() }
    );
    const response = await getTimeTracking(req);

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: API_USER_ID,
          issue: { milestoneId: 'm-1' },
        }),
      })
    );
  });

  test('sem credencial → 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/time-tracking');
    const response = await getTimeTracking(req);

    expect(response.status).toBe(401);
    expect(prisma.timeEntry.findMany).not.toHaveBeenCalled();
  });

  test('sessão válida continua funcionando', async () => {
    mockSession();
    mockHappyPath();

    const req = new NextRequest('http://localhost:3000/api/time-tracking');
    const response = await getTimeTracking(req);

    expect(response.status).toBe(200);
    expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: SESSION_USER_ID }),
      })
    );
  });
});
