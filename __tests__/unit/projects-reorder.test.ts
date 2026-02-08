import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock modules before imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/projects/reorder/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
  project: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  workspaceMember: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/projects/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/projects/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const req = createRequest({
      projectId: "proj-1",
      sortedProjectIds: ["proj-1", "proj-2"],
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("returns 400 when projectId is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const req = createRequest({
      sortedProjectIds: ["proj-1", "proj-2"],
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Missing");
  });

  test("returns 400 when sortedProjectIds is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const req = createRequest({
      projectId: "proj-1",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Missing");
  });

  test("returns 400 when sortedProjectIds is not an array", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const req = createRequest({
      projectId: "proj-1",
      sortedProjectIds: "not-an-array",
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Missing");
  });

  test("returns 404 when project does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.project.findUnique.mockResolvedValue(null);

    const req = createRequest({
      projectId: "nonexistent",
      sortedProjectIds: ["proj-1", "proj-2"],
    });

    const response = await POST(req);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Project not found");
  });

  test("returns 403 when user is not a workspace member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.project.findUnique.mockResolvedValue({
      id: "proj-1",
      workspaceId: "ws-1",
    });
    mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

    const req = createRequest({
      projectId: "proj-1",
      sortedProjectIds: ["proj-1", "proj-2"],
    });

    const response = await POST(req);
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe("Access denied");
  });

  test("returns success and calls $transaction with correct sortOrder updates", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.project.findUnique.mockResolvedValue({
      id: "proj-1",
      workspaceId: "ws-1",
    });
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({
      userId: "user-1",
      workspaceId: "ws-1",
      role: "MEMBER",
    });
    mockPrisma.$transaction.mockResolvedValue([]);

    const sortedIds = ["proj-3", "proj-1", "proj-2"];
    const req = createRequest({
      projectId: "proj-1",
      sortedProjectIds: sortedIds,
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify $transaction was called with update calls for each project
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
    expect(transactionArg).toHaveLength(3);
  });
});
