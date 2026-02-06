import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// POST /api/time-entries - Start a new time entry
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const body = await req.json();
    const { issueId, description } = body;

    if (!issueId) {
      const response = NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Check if there's already an active time entry for this specific issue
    const activeEntryForIssue = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        issueId,
        endTime: null,
      },
    });

    if (activeEntryForIssue) {
      const response = NextResponse.json(
        { error: "You already have an active timer for this issue." },
        { status: 400 }
      );
      return withCors(response);
    }

    // Create new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        issueId,
        userId: session.user.id,
        startTime: new Date(),
        description,
      },
      include: {
        issue: {
          include: {
            project: true,
            status: true,
            milestone: true,
          },
        },
      },
    });

    const response = NextResponse.json(timeEntry);
    return withCors(response);
  } catch (error) {
    console.error("Error creating time entry:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
}

// GET /api/time-entries - Get all active time entries for current user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const activeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        endTime: null,
      },
      include: {
        issue: {
          include: {
            project: true,
            status: true,
            milestone: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    const response = NextResponse.json(activeEntries);
    return withCors(response);
  } catch (error) {
    console.error("Error fetching active time entries:", error);
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
