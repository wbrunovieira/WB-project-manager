import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all user's workspaces
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: true,
    },
  });

  const workspaceIds = workspaceMemberships.map((wm) => wm.workspaceId);

  // Get all issues from user's workspaces
  const issues = await prisma.issue.findMany({
    where: {
      project: {
        workspaceId: {
          in: workspaceIds,
        },
      },
    },
    include: {
      status: true,
      project: {
        include: {
          workspace: true,
        },
      },
      assignee: true,
      labels: {
        include: {
          label: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get unique labels from all issues
  const allLabels = await prisma.label.findMany({
    where: {
      workspaceId: {
        in: workspaceIds,
      },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          {issues.length} issue{issues.length !== 1 ? "s" : ""} across all projects
        </p>
      </div>

      <DashboardClient issues={issues} labels={allLabels} />
    </div>
  );
}
