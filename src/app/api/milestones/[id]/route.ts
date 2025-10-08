import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

// GET /api/milestones/[id] - Get milestone by ID
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

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
        issues: {
          include: {
            status: true,
            assignee: true,
          },
        },
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    if (!milestone) {
      const response = NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    if (milestone.project.workspace.members.length === 0) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const response = NextResponse.json(milestone);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching milestone:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// PATCH /api/milestones/[id] - Update milestone
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
    const validated = updateMilestoneSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Check access
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      const response = NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    if (milestone.project.workspace.members.length === 0) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    const { startDate, targetDate, ...data } = validated.data;

    const updateData: any = { ...data };
    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (targetDate !== undefined) {
      updateData.targetDate = targetDate ? new Date(targetDate) : null;
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });

    const response = NextResponse.json(updatedMilestone);
    return withCors(response);
  } catch (error) {
    console.error("Error updating milestone:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// DELETE /api/milestones/[id] - Delete milestone
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

    // Check access
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      const response = NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    if (milestone.project.workspace.members.length === 0) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    await prisma.milestone.delete({
      where: { id },
    });

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error deleting milestone:", error);
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
