import { describe, test, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { scopeWhere, canAccessProject, scopeWhereFor } from "@/lib/access";

/**
 * A regra de acesso (#3106). Estes testes existem porque a regra antes estava
 * copiada em 34 trechos de 13 arquivos: centralizá-la só vale se o contrato
 * dela estiver fixado.
 */
beforeEach(() => {
  vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.projectMember.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null as never);
  vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null as never);
  vi.mocked(prisma.project.findUnique).mockResolvedValue(null as never);
});

describe("scopeWhere", () => {
  test("membro de workspace alcança tudo daquele workspace", () => {
    expect(scopeWhere({ workspaceIds: ["ws1"], projectIds: [] })).toEqual({
      OR: [{ workspaceId: { in: ["ws1"] } }],
    });
  });

  test("colaborador de projeto alcança só aquele projeto", () => {
    expect(scopeWhere({ workspaceIds: [], projectIds: ["p1"] })).toEqual({
      OR: [{ projectId: { in: ["p1"] } }],
    });
  });

  test("os dois caminhos somam — o acesso por projeto não tira o do workspace", () => {
    expect(scopeWhere({ workspaceIds: ["ws1"], projectIds: ["p9"] })).toEqual({
      OR: [{ workspaceId: { in: ["ws1"] } }, { projectId: { in: ["p9"] } }],
    });
  });

  // O erro clássico: `{ in: [] }` em alguns ORMs não filtra nada e devolve tudo.
  test("sem acesso nenhum → cláusula que não casa com nada (fail closed)", () => {
    expect(scopeWhere({ workspaceIds: [], projectIds: [] })).toEqual({ id: { in: [] } });
  });
});

describe("scopeWhereFor", () => {
  test("usuário sem vínculo nenhum não enxerga nada", async () => {
    expect(await scopeWhereFor("u-sem-nada")).toEqual({ id: { in: [] } });
  });

  test("colaborador só de projeto não recebe cláusula de workspace", async () => {
    vi.mocked(prisma.projectMember.findMany).mockResolvedValue([
      { projectId: "tatame" },
    ] as never);

    expect(await scopeWhereFor("u-dev")).toEqual({ OR: [{ projectId: { in: ["tatame"] } }] });
  });
});

describe("canAccessProject", () => {
  test("membro direto do projeto entra", async () => {
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({ id: "pm1" } as never);

    expect(await canAccessProject("u-dev", "tatame")).toBe(true);
    // Nem precisa olhar o workspace.
    expect(prisma.project.findUnique).not.toHaveBeenCalled();
  });

  test("membro do workspace entra mesmo sem vínculo direto", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ workspaceId: "ws1" } as never);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({ id: "wm1" } as never);

    expect(await canAccessProject("u-dono", "tatame")).toBe(true);
  });

  test("sem nenhum dos dois vínculos → não entra", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({ workspaceId: "ws1" } as never);

    expect(await canAccessProject("u-estranho", "tatame")).toBe(false);
  });

  test("projeto inexistente → não entra (não estoura)", async () => {
    expect(await canAccessProject("u", "nao-existe")).toBe(false);
  });
});
