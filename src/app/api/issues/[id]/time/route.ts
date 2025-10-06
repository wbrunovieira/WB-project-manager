import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

// GET /api/issues/[id]/time - Get total time tracked for an issue
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(response);
  }

  try {
    const { id } = await context.params;

    // Get all time entries for this issue
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        issueId: id,
      },
      select: {
        duration: true,
        endTime: true,
        startTime: true,
      },
    });

    // Calculate total time
    let totalSeconds = 0;
    const now = new Date();

    timeEntries.forEach((entry) => {
      if (entry.endTime) {
        // Completed entry
        totalSeconds += entry.duration;
      } else {
        // Active entry - calculate current duration
        const elapsed = Math.floor(
          (now.getTime() - new Date(entry.startTime).getTime()) / 1000
        );
        totalSeconds += entry.duration + elapsed;
      }
    });

    const response = NextResponse.json({
      totalSeconds,
      activeEntries: timeEntries.filter((e) => !e.endTime).length,
      completedEntries: timeEntries.filter((e) => e.endTime).length,
    });
    return withCors(response);
  } catch (error) {
    console.error("Error fetching issue time:", error);
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
