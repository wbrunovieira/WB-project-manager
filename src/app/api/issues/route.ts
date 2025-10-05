import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  teamId: z.string(),
  statusId: z.string(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
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
    const teamId = searchParams.get("teamId");
    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    // Get user's teams
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      select: { teamId: true },
    });

    const accessibleTeamIds = teamMemberships.map((tm) => tm.teamId);

    const where: any = {
      teamId: { in: accessibleTeamIds },
    };

    if (teamId) {
      where.teamId = teamId;
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
        team: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
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
    const validated = createIssueSchema.safeParse(body);

    if (!validated.success) {
      const response = NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
      return withCors(response);
    }

    const { teamId, labelIds, ...data } = validated.data;

    // Check if user has access to team
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    if (!teamMember) {
      const response = NextResponse.json(
        { error: "Access denied to team" },
        { status: 403 }
      );
      return withCors(response);
    }

    // Get team to generate identifier
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        issues: {
          orderBy: { identifier: "desc" },
          take: 1,
        },
      },
    });

    if (!team) {
      const response = NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    // Generate next identifier number
    let nextNumber = 1;
    if (team.issues.length > 0) {
      const lastIdentifier = team.issues[0].identifier;
      const match = lastIdentifier.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const identifier = nextNumber.toString();

    const issue = await prisma.issue.create({
      data: {
        ...data,
        teamId,
        identifier,
        creatorId: session.user.id,
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
        team: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
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
