import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { calculateBusinessHours } from "@/lib/business-hours";

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  statusId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  labelIds: z.array(z.string()).optional(),
});

// GET /api/issues/:id - Get issue by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  const { id } = await params;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  const { id } = await params;

  try {
    const body = await req.json();
    console.log("Update issue body:", body);
    const validated = updateIssueSchema.safeParse(body);

    if (!validated.success) {
      console.log("Validation error:", validated.error);
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        status: true,
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

    const { labelIds, ...data } = validated.data;

    // Check if status is changing
    let additionalData: any = {};
    if (data.statusId && data.statusId !== issue.statusId) {
      const newStatus = await prisma.status.findUnique({
        where: { id: data.statusId },
      });

      if (newStatus) {
        const oldStatusType = issue.status.type;
        const newStatusType = newStatus.type;

        // When moving to IN_PROGRESS for the first time
        if (newStatusType === "IN_PROGRESS" && !issue.firstResponseAt) {
          additionalData.firstResponseAt = new Date();
        }

        // When moving to DONE
        if (newStatusType === "DONE" && oldStatusType !== "DONE") {
          const now = new Date();
          additionalData.resolvedAt = now;

          // Calculate resolution time in business hours
          const startDate = issue.reportedAt || issue.createdAt;
          const resolutionTimeMinutes = calculateBusinessHours(startDate, now);
          additionalData.resolutionTimeMinutes = resolutionTimeMinutes;
        }

        // When reopening (moving from DONE to any other status)
        if (oldStatusType === "DONE" && newStatusType !== "DONE") {
          additionalData.reopenCount = issue.reopenCount + 1;
          additionalData.resolvedAt = null;
          additionalData.resolutionTimeMinutes = null;
        }
      }
    }

    // Update issue
    const updated = await prisma.issue.update({
      where: { id },
      data: {
        ...data,
        ...additionalData,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  const { id } = await params;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
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
      where: { id },
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
