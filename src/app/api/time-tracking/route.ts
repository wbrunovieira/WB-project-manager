import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// GET /api/time-tracking - Get time entries with optional filters
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { searchParams } = new URL(req.url);
    const milestoneId = searchParams.get("milestoneId");
    const labelId = searchParams.get("labelId");
    const projectId = searchParams.get("projectId");

    // Build where clause based on filters
    const issueFilter: Record<string, unknown> = {};

    if (milestoneId) {
      issueFilter.milestoneId = milestoneId;
    }

    if (projectId && !milestoneId) {
      issueFilter.projectId = projectId;
    }

    if (labelId) {
      issueFilter.labels = {
        some: {
          labelId,
        },
      };
    }

    const where: Record<string, unknown> = {
      userId: session.user.id,
      ...(Object.keys(issueFilter).length > 0 ? { issue: issueFilter } : {}),
    };

    // Fetch time entries with all related data
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        issue: {
          include: {
            project: true,
            status: true,
            milestone: true,
            labels: {
              include: {
                label: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Calculate total time and format response
    let totalSeconds = 0;
    const now = new Date();

    const formattedEntries = timeEntries.map((entry) => {
      let entryDuration = entry.duration;

      if (!entry.endTime) {
        // Active entry - calculate current duration
        const elapsed = Math.floor(
          (now.getTime() - new Date(entry.startTime).getTime()) / 1000
        );
        entryDuration += elapsed;
      }

      totalSeconds += entryDuration;

      return {
        ...entry,
        calculatedDuration: entryDuration,
      };
    });

    // Group by issue for summary
    const groupedByIssue = formattedEntries.reduce((acc: Record<string, { issue: typeof entry.issue; totalSeconds: number; entries: typeof formattedEntries }>, entry) => {
      const issueId = entry.issue.id;
      if (!acc[issueId]) {
        acc[issueId] = {
          issue: entry.issue,
          totalSeconds: 0,
          entries: [],
        };
      }
      acc[issueId].totalSeconds += entry.calculatedDuration;
      acc[issueId].entries.push(entry);
      return acc;
    }, {});

    const response = NextResponse.json({
      totalSeconds,
      entries: formattedEntries,
      groupedByIssue: Object.values(groupedByIssue),
    });
    return withCors(response);
  } catch (error) {
    console.error("Error fetching time tracking data:", error);
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
