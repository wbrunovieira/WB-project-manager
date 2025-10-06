import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  workspaceId: z.string(),
  statusId: z.string(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  type: z.enum(["FEATURE", "MAINTENANCE", "BUG", "IMPROVEMENT"]).default("FEATURE"),
  reportedAt: z.string().datetime().or(z.literal("")).optional(), // ISO datetime string or empty
  labelIds: z.array(z.string()).optional(),
});

// GET /api/issues - List all issues
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    // Get user's workspaces
    const workspaceMemberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    const accessibleWorkspaceIds = workspaceMemberships.map((wm) => wm.workspaceId);

    const where: any = {
      workspaceId: { in: accessibleWorkspaceIds },
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (status) {
      where.status = { type: status };
    }

    if (priority) {
      where.priority = priority;
    }

    const issues = await prisma.issue.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    const response = NextResponse.json(issues);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching issues:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// POST /api/issues - Create new issue
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    console.log("Creating issue with body:", body);
    const validated = createIssueSchema.safeParse(body);

    if (!validated.success) {
      console.log("Validation failed:", validated.error);
      const response = NextResponse.json(
        {
          error: validated.error?.errors?.[0]?.message || "Validation failed",
          details: validated.error?.errors || []
        },
        { status: 400 }
      );
      return withCors(response);
    }

    const { workspaceId, labelIds, reportedAt, ...data } = validated.data;

    // Check if user has access to workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      const response = NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
      return withCors(response);
    }

    // Get all issues for this workspace to find the highest identifier
    const existingIssues = await prisma.issue.findMany({
      where: { workspaceId },
      select: { identifier: true },
    });

    // Generate next identifier number
    let nextNumber = 1;
    if (existingIssues.length > 0) {
      const identifierNumbers = existingIssues
        .map((issue) => parseInt(issue.identifier, 10))
        .filter((num) => !isNaN(num));

      if (identifierNumbers.length > 0) {
        nextNumber = Math.max(...identifierNumbers) + 1;
      }
    }

    const identifier = nextNumber.toString();

    const issue = await prisma.issue.create({
      data: {
        ...data,
        workspaceId,
        identifier,
        creatorId: session.user.id,
        reportedAt: reportedAt && reportedAt !== "" ? new Date(reportedAt) : undefined,
        labels: labelIds
          ? {
              create: labelIds.map((labelId) => ({
                labelId,
              })),
            }
          : undefined,
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

    const response = NextResponse.json(issue, { status: 201 });
    return withCors(response);
  } catch (error) {
    console.error("Error creating issue:", error);
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
