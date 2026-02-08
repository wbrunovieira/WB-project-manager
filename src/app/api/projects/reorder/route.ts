import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// POST /api/projects/reorder - Reorder projects within a workspace
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const { projectId, sortedProjectIds } = body;

    if (!projectId || !Array.isArray(sortedProjectIds)) {
      const response = NextResponse.json(
        { error: "Missing projectId or sortedProjectIds array" },
        { status: 400 }
      );
      return withCors(response);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: project.workspaceId,
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

    await prisma.$transaction(
      sortedProjectIds.map((id: string, index: number) =>
        prisma.project.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error reordering projects:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response);
}
