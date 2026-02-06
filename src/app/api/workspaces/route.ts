import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { StatusType } from "@/generated/prisma";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  icon: z.string().optional(),
});

// GET /api/workspaces - List all workspaces for the user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const workspaceMemberships = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: {
        workspace: {
          name: "asc",
        },
      },
    });

    const workspaces = workspaceMemberships.map((wm) => ({
      ...wm.workspace,
      role: wm.role,
    }));

    const response = NextResponse.json(workspaces);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const validated = createWorkspaceSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    const { name, slug, icon } = validated.data;

    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      const response = NextResponse.json(
        { error: "A workspace with this slug already exists" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Create workspace and add user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        icon: icon || null,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create default statuses for the new workspace
    const statuses: Array<{ name: string; type: StatusType; position: number; color: string }> = [
      { name: "Backlog", type: "BACKLOG", position: 0, color: "#94a3b8" },
      { name: "Todo", type: "TODO", position: 1, color: "#64748b" },
      { name: "In Progress", type: "IN_PROGRESS", position: 2, color: "#3b82f6" },
      { name: "Done", type: "DONE", position: 3, color: "#10b981" },
      { name: "Canceled", type: "CANCELED", position: 4, color: "#6b7280" },
    ];

    await prisma.status.createMany({
      data: statuses.map((status) => ({
        ...status,
        workspaceId: workspace.id,
      })),
    });

    const response = NextResponse.json(workspace, { status: 201 });
    return withCors(response);
  } catch (error) {
    console.error("Error creating workspace:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response);
}
