import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectIssuesClient } from "@/components/projects/project-issues-client";

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
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              project.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-800"
                : project.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : project.status === "PLANNED"
                ? "bg-gray-100 text-gray-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {project.status.replace("_", " ")}
          </span>
        </div>

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
        {(project.startDate || project.targetDate) && (
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            {project.startDate && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Start: {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.targetDate && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Target: {new Date(project.targetDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
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
