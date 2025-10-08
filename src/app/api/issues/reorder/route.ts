import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// POST /api/issues/reorder - Reorder issues
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const { issueId, statusType, sortedIssueIds } = body;

    if (!issueId || !statusType || !sortedIssueIds || !Array.isArray(sortedIssueIds)) {
      const response = NextResponse.json(
        { error: "Missing issueId, statusType, or sortedIssueIds" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Get the issue to check access
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { status: true },
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

    // Verify the status type matches
    if (issue.status.type !== statusType) {
      const response = NextResponse.json(
        { error: "Status type mismatch" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Update sortOrder for all issues in the sorted list
    // Using a transaction to ensure atomicity
    await prisma.$transaction(
      sortedIssueIds.map((id: string, index: number) =>
        prisma.issue.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error reordering issue:", error);
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
