import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TimeTrackingClient } from "@/components/time-tracking/time-tracking-client";

export default async function TimeTrackingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get user's workspaces
  const userWorkspaces = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      workspaceId: true,
    },
  });

  const workspaceIds = userWorkspaces.map((wm) => wm.workspaceId);

  // Fetch all projects, milestones, and labels for filters
  const [projects, milestones, labels] = await Promise.all([
    prisma.project.findMany({
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.milestone.findMany({
      where: {
        project: {
          workspaceId: {
            in: workspaceIds,
          },
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.label.findMany({
      where: {
        workspaceId: {
          in: workspaceIds,
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">Time Tracking</h1>
        <p className="text-gray-300 mt-1">
          View and analyze time spent on issues
        </p>
      </div>

      <TimeTrackingClient
        projects={projects}
        milestones={milestones}
        labels={labels}
      />
    </div>
  );
}
