import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// POST /api/milestones/reorder - Reorder milestones
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const { milestoneId, sortedMilestoneIds } = body;

    if (!milestoneId || !Array.isArray(sortedMilestoneIds)) {
      const response = NextResponse.json(
        { error: "Missing milestoneId or sortedMilestoneIds array" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Get the milestone to check access
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: true,
      },
    });

    if (!milestone) {
      const response = NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: milestone.project.workspaceId,
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

    // Update all milestones with their new sortOrder in a transaction
    await prisma.$transaction(
      sortedMilestoneIds.map((id: string, index: number) =>
        prisma.milestone.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error reordering milestone:", error);
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
