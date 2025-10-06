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
    <>
      {/* Welcome Section */}
      <div className="border-b border-[#792990]/20 bg-gradient-to-r from-[#350459] to-[#4a0672] px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Welcome back, {session.user.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-[#FFB947]/20 px-3 py-1 text-sm font-semibold text-[#FFB947]">
                {issues.length}
              </span>
              <span>
                issue{issues.length !== 1 ? "s" : ""} across all projects
              </span>
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="h-16 w-px bg-[#792990]/30"></div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Active Workspaces</div>
              <div className="text-2xl font-bold text-gray-100">{workspaceMemberships.length}</div>
            </div>
          </div>
        </div>
      </div>

      <DashboardClient issues={issues} labels={allLabels} />
    </>
  );
}
