import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  workspaceId: z.string(),
  type: z.enum(["DEVELOPMENT", "MAINTENANCE"]).optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELED"]).optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

// GET /api/projects - List all projects
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");

    // Get user's workspaces
    const workspaceMemberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    const accessibleWorkspaceIds = workspaceMemberships.map(
      (wm) => wm.workspaceId
    );

    const where: Record<string, unknown> = {
      workspaceId: { in: accessibleWorkspaceIds },
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const response = NextResponse.json(projects);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching projects:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const validated = createProjectSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    const { workspaceId, startDate, targetDate, ...data } = validated.data;

    // Check if user has access to workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      const response = NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
      return withCors(response);
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        workspaceId,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const response = NextResponse.json(project, { status: 201 });
    return withCors(response);
  } catch (error) {
    console.error("Error creating project:", error);
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
