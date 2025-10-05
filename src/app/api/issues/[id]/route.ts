import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  statusId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  labelIds: z.array(z.string()).optional(),
});

// GET /api/issues/:id - Get issue by ID
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
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!issue) {
      const response = NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: issue.workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const response = NextResponse.json(issue);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching issue:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// PATCH /api/issues/:id - Update issue
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
    const validated = updateIssueSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
      return withCors(response);
    }

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!issue) {
      const response = NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: issue.workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const { labelIds, ...data } = validated.data;

    // Update issue
    const updated = await prisma.issue.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId) => ({
              labelId,
            })),
          },
        }),
      },
      include: {
        status: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    const response = NextResponse.json(updated);
    return withCors(response);
  } catch (error) {
    console.error("Error updating issue:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// DELETE /api/issues/:id - Delete issue
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
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!issue) {
      const response = NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: issue.workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    await prisma.issue.delete({
      where: { id: params.id },
    });

    const response = NextResponse.json(
      { message: "Issue deleted successfully" },
      { status: 200 }
    );
    return withCors(response);
  } catch (error) {
    console.error("Error deleting issue:", error);
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
