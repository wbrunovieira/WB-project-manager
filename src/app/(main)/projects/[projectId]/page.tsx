import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2 } from "lucide-react";

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

      {/* Issues by Status */}
      <div className="space-y-8">
        {Object.entries(issuesByStatus).map(([statusType, issues]) => {
          if (issues.length === 0) return null;

          const statusName =
            issues[0]?.status.name || statusType.replace("_", " ");

          return (
            <div key={statusType}>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {statusName} ({issues.length})
              </h2>

              <div className="space-y-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm font-mono text-gray-500">
                        {issue.team.key}-{issue.identifier}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Labels */}
                      {issue.labels.map((issueLabel) => (
                        <span
                          key={issueLabel.labelId}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${issueLabel.label.color}20`,
                            color: issueLabel.label.color,
                          }}
                        >
                          {issueLabel.label.name}
                        </span>
                      ))}

                      {/* Priority */}
                      {issue.priority !== "NO_PRIORITY" && (
                        <span
                          className={`text-xs font-medium ${
                            issue.priority === "URGENT"
                              ? "text-red-600"
                              : issue.priority === "HIGH"
                              ? "text-orange-600"
                              : issue.priority === "MEDIUM"
                              ? "text-blue-600"
                              : "text-gray-500"
                          }`}
                        >
                          {issue.priority}
                        </span>
                      )}

                      {/* Assignee */}
                      {issue.assignee && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                            {issue.assignee.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {totalIssues === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No issues in this project yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
