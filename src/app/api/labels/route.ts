import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

// GET /api/labels - List all labels for a workspace
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      const response = NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
      return withCors(response);
    }

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

    const labels = await prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });

    const response = NextResponse.json(labels);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching labels:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// POST /api/labels - Create new label
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const validated = createLabelSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
      return withCors(response);
    }

    const { workspaceId, ...data } = validated.data;

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

    const label = await prisma.label.create({
      data: {
        ...data,
        workspaceId,
      },
    });

    const response = NextResponse.json(label, { status: 201 });
    return withCors(response);
  } catch (error) {
    console.error("Error creating label:", error);
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
