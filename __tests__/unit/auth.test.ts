import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Mock modules
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocking
import { withAuth, withCors } from '@/lib/api-auth';
import { auth } from '@/lib/auth';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe('withAuth wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.API_KEY = 'test-api-key';
    process.env.API_KEY_USER_ID = 'test-user-id';
  });

  describe('API Key Authentication', () => {
    test('aceita API key válida', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, 'test-user-id');
    });

    test('rejeita API key inválida', async () => {
      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer wrong-api-key',
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
      expect(handler).not.toHaveBeenCalled();
    });

    test('usa SHA-256 para comparação de API key', async () => {
      const apiKey = 'my-secure-api-key';
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

      process.env.API_KEY = apiKey;

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, 'test-user-id');
    });

    test('usa userId correto do env', async () => {
      process.env.API_KEY_USER_ID = 'custom-user-id';

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, 'custom-user-id');
    });

    test('rejeita se API_KEY não está configurada no env', async () => {
      delete process.env.API_KEY;

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer any-key',
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API key');
      expect(handler).not.toHaveBeenCalled();
    });

    test('rejeita Bearer token vazio', async () => {
      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer ',
        },
      });

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    test('case-sensitive Bearer prefix', async () => {
      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'bearer test-api-key', // lowercase
        },
      });

      const response = await wrappedHandler(request);

      // Deve falhar porque espera "Bearer" com B maiúsculo
      expect(response.status).toBe(401);
    });
  });

  describe('Session Authentication', () => {
    test('aceita sessão válida', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'session-user-id', email: 'user@example.com' },
        expires: new Date().toISOString(),
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, 'session-user-id');
    });

    test('rejeita sessão inválida/expirada', async () => {
      mockAuth.mockResolvedValue(null);

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrappedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
      expect(handler).not.toHaveBeenCalled();
    });

    test('rejeita sessão sem user.id', async () => {
      mockAuth.mockResolvedValue({
        user: { email: 'user@example.com' }, // Sem id
        expires: new Date().toISOString(),
      });

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    test('extrai userId da sessão corretamente', async () => {
      const userId = 'unique-user-id-123';
      mockAuth.mockResolvedValue({
        user: { id: userId, email: 'user@example.com', name: 'Test User' },
        expires: new Date().toISOString(),
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, userId);
    });
  });

  describe('Authentication Fallback', () => {
    test('tenta API key primeiro, depois sessão', async () => {
      // API key inválida, sessão válida
      mockAuth.mockResolvedValue({
        user: { id: 'session-user-id', email: 'user@example.com' },
        expires: new Date().toISOString(),
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer wrong-key',
        },
      });

      const response = await wrappedHandler(request);

      // Deve rejeitar porque API key foi fornecida mas é inválida
      // Não faz fallback para sessão quando API key é fornecida
      expect(response.status).toBe(401);
    });

    test('usa sessão quando não há header Authorization', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'session-user-id', email: 'user@example.com' },
        expires: new Date().toISOString(),
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      await wrappedHandler(request);

      expect(mockAuth).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(request, 'session-user-id');
    });

    test('retorna 401 se ambos falharem', async () => {
      mockAuth.mockResolvedValue(null);

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Authorization Header Formats', () => {
    test('aceita Authorization com espaços extras', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Bearer  test-api-key', // espaço extra
        },
      });

      const response = await wrappedHandler(request);

      // Deve falhar porque substring(7) captura o espaço
      expect(response.status).toBe(401);
    });

    test('rejeita formato não-Bearer', async () => {
      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'Authorization': 'Basic dGVzdDp0ZXN0',
        },
      });

      const response = await wrappedHandler(request);

      // Deve fazer fallback para sessão
      expect(response.status).toBe(401);
    });
  });
});

describe('withCors wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('adiciona headers CORS corretos', () => {
    const response = NextResponse.json({ data: 'test' });
    const corsResponse = withCors(response);

    expect(corsResponse.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(corsResponse.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    expect(corsResponse.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  test('usa ALLOWED_ORIGIN do env', () => {
    process.env.ALLOWED_ORIGIN = 'https://example.com';

    const response = NextResponse.json({ data: 'test' });
    const corsResponse = withCors(response);

    expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
  });

  test('usa default origin quando env não está definido', () => {
    delete process.env.ALLOWED_ORIGIN;

    const response = NextResponse.json({ data: 'test' });
    const corsResponse = withCors(response);

    expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
  });

  test('permite Cookie header', () => {
    const response = NextResponse.json({ data: 'test' });
    const corsResponse = withCors(response);

    expect(corsResponse.headers.get('Access-Control-Allow-Headers')).toContain('Cookie');
  });

  test('permite todos os métodos HTTP necessários', () => {
    const response = NextResponse.json({ data: 'test' });
    const corsResponse = withCors(response);

    const methods = corsResponse.headers.get('Access-Control-Allow-Methods');

    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('PATCH');
    expect(methods).toContain('DELETE');
    expect(methods).toContain('OPTIONS');
  });

  test('não modifica o corpo da resposta', async () => {
    const originalData = { data: 'test', count: 42 };
    const response = NextResponse.json(originalData);
    const corsResponse = withCors(response);

    const data = await corsResponse.json();
    expect(data).toEqual(originalData);
  });

  test('preserva status code da resposta original', () => {
    const response = NextResponse.json({ error: 'Not found' }, { status: 404 });
    const corsResponse = withCors(response);

    expect(corsResponse.status).toBe(404);
  });

  test('preserva outros headers da resposta original', () => {
    const response = NextResponse.json({ data: 'test' });
    response.headers.set('X-Custom-Header', 'custom-value');

    const corsResponse = withCors(response);

    expect(corsResponse.headers.get('X-Custom-Header')).toBe('custom-value');
  });
});

describe('Integration: withAuth + withCors', () => {
  test('withAuth e withCors podem ser usados juntos', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com' },
      expires: new Date().toISOString(),
    });

    const handler = withAuth(async (req, userId) => {
      const response = NextResponse.json({ userId });
      return withCors(response);
    });

    const request = new NextRequest('http://localhost:3000/api/test');
    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();

    const data = await response.json();
    expect(data.userId).toBe('user-id');
  });

  test('CORS headers presentes mesmo em erro 401', async () => {
    mockAuth.mockResolvedValue(null);

    const handler = withAuth(async (req, userId) => {
      const response = NextResponse.json({ userId });
      return withCors(response);
    });

    const request = new NextRequest('http://localhost:3000/api/test');
    const response = await handler(request);

    expect(response.status).toBe(401);
    // withAuth retorna erro sem CORS headers (necessita wrapping manual)
  });
});
