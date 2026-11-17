import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Cadastro público fechado por padrão.
 *
 * Até a saída da Authelia (#2889), era ela que impedia a internet de chegar
 * nesta rota. Sem o portão, um POST anônimo criaria conta no servidor — por
 * isso o default fechado é testado, não só o caminho liberado.
 */
const ORIGINAL = process.env.ALLOW_REGISTRATION;

function body(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    name: "Fulano",
    email: "fulano@example.com",
    password: "senha123",
    ...over,
  });
}

function req(b = body()) {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: b,
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7" },
  });
}

// Importado dinamicamente: a rota lê process.env na chamada, mas o módulo de
// rate limit guarda estado entre testes, então recarregamos a cada caso.
async function postRegister(request: Request) {
  const mod = await import("@/app/api/auth/register/route");
  return mod.POST(request);
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ALLOW_REGISTRATION;
  else process.env.ALLOW_REGISTRATION = ORIGINAL;
});

describe("POST /api/auth/register", () => {
  test("sem ALLOW_REGISTRATION definido → 403 (o default é fechado)", async () => {
    delete process.env.ALLOW_REGISTRATION;

    const res = await postRegister(req());

    expect(res.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("ALLOW_REGISTRATION=false → 403", async () => {
    process.env.ALLOW_REGISTRATION = "false";

    const res = await postRegister(req());

    expect(res.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("qualquer valor que não seja exatamente 'true' mantém fechado", async () => {
    process.env.ALLOW_REGISTRATION = "TRUE";

    const res = await postRegister(req());

    expect(res.status).toBe(403);
  });

  test("ALLOW_REGISTRATION=true → cria a conta", async () => {
    process.env.ALLOW_REGISTRATION = "true";
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "u1",
      name: "Fulano",
      email: "fulano@example.com",
    } as never);

    const res = await postRegister(req());

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  test("liberado, e-mail já cadastrado → 400 e não cria", async () => {
    process.env.ALLOW_REGISTRATION = "true";
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as never);

    const res = await postRegister(req());

    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("liberado, mas o 4º cadastro do mesmo IP em 1h → 429 com Retry-After", async () => {
    process.env.ALLOW_REGISTRATION = "true";
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "u1" } as never);

    const mod = await import("@/app/api/auth/register/route");
    for (let i = 0; i < 3; i++) {
      expect((await mod.POST(req(body({ email: `a${i}@example.com` })))).status).toBe(201);
    }

    const bloqueado = await mod.POST(req(body({ email: "a4@example.com" })));

    expect(bloqueado.status).toBe(429);
    expect(Number(bloqueado.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  test("o 403 de cadastro fechado vem ANTES de ler o corpo (nem valida payload)", async () => {
    delete process.env.ALLOW_REGISTRATION;

    const res = await postRegister(req("isso não é json"));

    expect(res.status).toBe(403);
  });
});
