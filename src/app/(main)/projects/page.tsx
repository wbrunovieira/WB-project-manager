import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Plus } from "lucide-react";
import { ProjectsHeader } from "@/components/projects/projects-header";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's workspaces
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: {
        include: {
          projects: {
            include: {
              issues: {
                include: {
                  status: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
    },
  });

  const projects = workspaceMemberships.flatMap((wm) => wm.workspace.projects);
  const workspaceId = workspaceMemberships[0]?.workspaceId || "";

  return (
    <div className="p-8">
      <ProjectsHeader workspaceId={workspaceId} projectCount={projects.length} />

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No projects yet</p>
          </div>
        ) : (
          projects.map((project) => {
            const totalIssues = project.issues.length;
            const completedIssues = project.issues.filter(
              (issue) => issue.status.type === "DONE"
            ).length;
            const progress =
              totalIssues > 0
                ? Math.round((completedIssues / totalIssues) * 100)
                : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {completedIssues} of {totalIssues} completed
                      </span>
                      <span className="font-medium text-gray-900">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    {project.startDate && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          Start:{" "}
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.targetDate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          Target:{" "}
                          {new Date(project.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
