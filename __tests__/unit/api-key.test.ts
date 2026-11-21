import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resolveApiKey, hashApiKey, generateApiKey } from "@/lib/api-key";

/**
 * Resolução de chave de API para usuário (issue #3105).
 *
 * O caso que NÃO pode quebrar é a ponte: ~15 Claudes de outros projetos usam a
 * chave única de ambiente, e trocar o mecanismo sem compatibilidade derrubaria
 * todos de uma vez. Por isso ele é testado primeiro.
 */

const API_KEY_ORIG = process.env.API_KEY;
const USER_ID_ORIG = process.env.API_KEY_USER_ID;

beforeEach(() => {
  process.env.API_KEY = "chave-de-ambiente-legada";
  process.env.API_KEY_USER_ID = "user-dono";
  vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null as never);
  vi.mocked(prisma.apiKey.update).mockResolvedValue({} as never);
});

afterEach(() => {
  process.env.API_KEY = API_KEY_ORIG;
  process.env.API_KEY_USER_ID = USER_ID_ORIG;
});

describe("ponte com a chave de ambiente (não pode quebrar)", () => {
  test("a chave antiga continua autenticando como o usuário do env", async () => {
    const r = await resolveApiKey("chave-de-ambiente-legada");

    expect(r).toEqual({ userId: "user-dono", apiKeyId: null });
    // Nem consulta o banco: o caminho legado resolve antes.
    expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  test("sem API_KEY_USER_ID a chave de ambiente não vale (fail closed)", async () => {
    delete process.env.API_KEY_USER_ID;

    expect(await resolveApiKey("chave-de-ambiente-legada")).toBeNull();
  });

  test("sem API_KEY configurada, cai para o banco em vez de aceitar qualquer coisa", async () => {
    delete process.env.API_KEY;

    expect(await resolveApiKey("qualquer-coisa")).toBeNull();
    expect(prisma.apiKey.findUnique).toHaveBeenCalled();
  });
});

describe("chaves por usuário", () => {
  test("chave válida resolve para o DONO dela, não para o do env", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "k1",
      userId: "user-dev-colaborador",
      revokedAt: null,
      lastUsedAt: null,
    } as never);

    const r = await resolveApiKey("chave-do-dev");

    expect(r).toEqual({ userId: "user-dev-colaborador", apiKeyId: "k1" });
  });

  test("busca pelo HASH, nunca pelo valor em claro", async () => {
    await resolveApiKey("chave-do-dev");

    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hash: hashApiKey("chave-do-dev") } })
    );
    const chamada = JSON.stringify(vi.mocked(prisma.apiKey.findUnique).mock.calls[0]);
    expect(chamada).not.toContain("chave-do-dev");
  });

  test("chave revogada → não autentica", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "k1",
      userId: "user-dev",
      revokedAt: new Date("2026-01-01"),
      lastUsedAt: null,
    } as never);

    expect(await resolveApiKey("chave-revogada")).toBeNull();
  });

  test("chave inexistente → não autentica", async () => {
    expect(await resolveApiKey("nunca-existiu")).toBeNull();
  });
});

describe("registro de uso (auditoria)", () => {
  test("grava lastUsedAt quando nunca foi usada", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "k1",
      userId: "u1",
      revokedAt: null,
      lastUsedAt: null,
    } as never);

    await resolveApiKey("chave");

    expect(prisma.apiKey.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "k1" } })
    );
  });

  test("não escreve a cada request — uso recente não regrava", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "k1",
      userId: "u1",
      revokedAt: null,
      lastUsedAt: new Date(Date.now() - 1000),
    } as never);

    await resolveApiKey("chave");

    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  test("falha ao gravar auditoria NÃO derruba o acesso legítimo", async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "k1",
      userId: "u1",
      revokedAt: null,
      lastUsedAt: null,
    } as never);
    vi.mocked(prisma.apiKey.update).mockRejectedValue(new Error("banco fora") as never);

    expect(await resolveApiKey("chave")).toEqual({ userId: "u1", apiKeyId: "k1" });
  });
});

describe("geração de chave", () => {
  test("64 caracteres hex — 32 bytes de aleatoriedade", () => {
    expect(generateApiKey()).toMatch(/^[0-9a-f]{64}$/);
  });

  test("duas chamadas nunca coincidem", () => {
    const chaves = new Set(Array.from({ length: 100 }, () => generateApiKey()));
    expect(chaves.size).toBe(100);
  });

  test("hash é estável e diferente do valor original", () => {
    const k = generateApiKey();
    expect(hashApiKey(k)).toBe(hashApiKey(k));
    expect(hashApiKey(k)).not.toBe(k);
    expect(hashApiKey(k)).toMatch(/^[0-9a-f]{64}$/);
  });
});
