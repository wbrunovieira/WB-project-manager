import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .optional(),
  icon: z.string().optional(),
});

// GET /api/workspaces/[id] - Get workspace by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            issues: true,
          },
        },
      },
    });

    if (!workspace) {
      const response = NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access to workspace
    const membership = workspace.members.find(
      (m) => m.userId === session.user.id
    );

    if (!membership) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const response = NextResponse.json({
      ...workspace,
      userRole: membership.role,
    });
    return withCors(response);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateWorkspaceSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Check if user is owner or admin
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: id,
        },
      },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      const response = NextResponse.json(
        { error: "Only workspace owners and admins can update workspace settings" },
        { status: 403 }
      );
      return withCors(response);
    }

    // Check if slug is being changed and if it already exists
    if (validated.data.slug) {
      const existingWorkspace = await prisma.workspace.findUnique({
        where: { slug: validated.data.slug },
      });

      if (existingWorkspace && existingWorkspace.id !== id) {
        const response = NextResponse.json(
          { error: "A workspace with this slug already exists" },
          { status: 400 }
        );
        return withCors(response);
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: validated.data,
    });

    const response = NextResponse.json(workspace);
    return withCors(response);
  } catch (error) {
    console.error("Error updating workspace:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { id } = await params;

    // Check if user is owner
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: id,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      const response = NextResponse.json(
        { error: "Only workspace owners can delete workspaces" },
        { status: 403 }
      );
      return withCors(response);
    }

    await prisma.workspace.delete({
      where: { id },
    });

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error deleting workspace:", error);
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
