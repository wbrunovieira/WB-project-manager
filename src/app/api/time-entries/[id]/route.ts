import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/api-auth";

// PATCH /api/time-entries/[id] - Stop/pause a time entry
export const PATCH = withAuth<{ params: Promise<{ id: string }> }>(async (
  req: NextRequest,
  userId: string,
  ctx
) => {
  try {
    const { id } = await ctx.params;
    await req.json();

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!timeEntry) {
      const response = NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    if (timeEntry.userId !== userId) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    if (timeEntry.endTime) {
      const response = NextResponse.json(
        { error: "Time entry already stopped" },
        { status: 400 }
      );
      return withCors(response);
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - timeEntry.startTime.getTime()) / 1000
    );

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        duration: timeEntry.duration + duration,
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

    const response = NextResponse.json(updatedEntry);
    return withCors(response);
  } catch (error) {
    console.error("Error updating time entry:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
});

// DELETE /api/time-entries/[id] - Delete a time entry
export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(async (
  req: NextRequest,
  userId: string,
  ctx
) => {
  try {
    const { id } = await ctx.params;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!timeEntry) {
      const response = NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
      return withCors(response);
    }

    if (timeEntry.userId !== userId) {
      const response = NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
      return withCors(response);
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    const response = NextResponse.json({ success: true });
    return withCors(response);
  } catch (error) {
    console.error("Error deleting time entry:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return withCors(response);
  }
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response);
}
