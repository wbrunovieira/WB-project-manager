import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MaintenanceDashboardClient } from "@/components/maintenance/maintenance-dashboard-client";
import { calculateBusinessHours } from "@/lib/business-hours";

export default async function MaintenanceDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's workspaces
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  const workspaceIds = workspaceMemberships.map((wm) => wm.workspaceId);

  // Get all maintenance and bug issues
  const issues = await prisma.issue.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      type: { in: ["MAINTENANCE", "BUG"] },
    },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get all maintenance projects
  const maintenanceProjects = await prisma.project.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      type: "MAINTENANCE",
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          issues: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#350459]">
      <MaintenanceDashboardClient
        issues={issues}
        maintenanceProjects={maintenanceProjects}
      />
    </div>
  );
}
