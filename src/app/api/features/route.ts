import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createFeatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project ID is required"),
});

// GET /api/features - List all features for a project
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      const response = NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Check if user has access to project via workspace
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

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
        { error: "Access denied to project" },
        { status: 403 }
      );
      return withCors(response);
    }

    const features = await prisma.feature.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });

    const response = NextResponse.json(features);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching features:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// POST /api/features - Create new feature
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const validated = createFeatureSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
      return withCors(response);
    }

    const { projectId, ...data } = validated.data;

    // Check if user has access to project via workspace
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    if (!project) {
      const response = NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
      return withCors(response);
    }

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
        { error: "Access denied to project" },
        { status: 403 }
      );
      return withCors(response);
    }

    const feature = await prisma.feature.create({
      data: {
        ...data,
        projectId,
      },
    });

    const response = NextResponse.json(feature, { status: 201 });
    return withCors(response);
  } catch (error) {
    console.error("Error creating feature:", error);
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
