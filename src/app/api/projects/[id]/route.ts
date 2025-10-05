import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELED"]).optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

// GET /api/projects/:id - Get project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        issues: {
          include: {
            status: true,
            team: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            labels: {
              include: {
                label: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const response = NextResponse.json(project);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching project:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// PATCH /api/projects/:id - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const validated = updateProjectSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
      return withCors(response);
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const { startDate, targetDate, ...data } = validated.data;

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(targetDate !== undefined && {
          targetDate: targetDate ? new Date(targetDate) : null,
        }),
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

    const response = NextResponse.json(updated);
    return withCors(response);
  } catch (error) {
    console.error("Error updating project:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    const response = NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
    return withCors(response);
  } catch (error) {
    console.error("Error deleting project:", error);
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
