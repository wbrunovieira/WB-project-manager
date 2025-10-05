import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProjectIssuesClient } from "@/components/projects/project-issues-client";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectDates } from "@/components/projects/project-dates";

export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.projectId,
    },
    include: {
      workspace: true,
      issues: {
        include: {
          status: true,
          team: true,
          assignee: true,
          labels: {
            include: {
              label: true,
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Group issues by status type
  const issuesByStatus: Record<string, typeof project.issues> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    CANCELED: [],
  };

  project.issues.forEach((issue) => {
    if (issuesByStatus[issue.status.type]) {
      issuesByStatus[issue.status.type].push(issue);
    }
  });

  const totalIssues = project.issues.length;
  const completedIssues = project.issues.filter(
    (issue) => issue.status.type === "DONE"
  ).length;
  const progress =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // Get teams, statuses, and users for create modal
  const teams = await prisma.team.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      key: true,
    },
  });

  const statuses = await prisma.status.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      workspaces: {
        some: {
          workspaceId: project.workspaceId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <ProjectDetailHeader
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            targetDate: project.targetDate,
          }}
        />

        {/* Progress */}
        <div className="mt-6 max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {completedIssues} of {totalIssues} issues completed
            </span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <ProjectDates
          startDate={project.startDate}
          targetDate={project.targetDate}
        />
      </div>

      {/* Issues Section with New Issue Button */}
      <ProjectIssuesClient
        projectId={project.id}
        issuesByStatus={issuesByStatus}
        totalIssues={totalIssues}
        teams={teams}
        statuses={statuses}
        users={users}
      />
    </div>
  );
}
