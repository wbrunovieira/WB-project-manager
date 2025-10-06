"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateDisplay } from "@/components/ui/date-display";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: Date | null;
  targetDate?: Date | null;
  workspace: {
    id: string;
    name: string;
    icon: string | null;
  };
  issues: Array<{
    status: {
      type: string;
    };
  }>;
}

interface WorkspaceWithProjects {
  id: string;
  name: string;
  icon: string | null;
  projects: Project[];
}

interface ProjectsListClientProps {
  workspacesWithProjects: WorkspaceWithProjects[];
}

export function ProjectsListClient({ workspacesWithProjects }: ProjectsListClientProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const totalProjects = workspacesWithProjects.reduce(
    (sum, ws) => sum + ws.projects.length,
    0
  );

  if (totalProjects === 0) {
    return (
      <div className="rounded-lg border border-[#792990]/20 bg-[#792990]/5 p-12 text-center">
        <p className="text-gray-300">No projects yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {workspacesWithProjects.map((workspace) => {
          if (workspace.projects.length === 0) return null;

          return (
            <div key={workspace.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-[#792990] to-transparent"></div>
                <span className="text-2xl">{workspace.icon || "🏢"}</span>
                <h2 className="text-xl font-semibold text-gray-100">
                  {workspace.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#792990]/20 text-gray-400 text-xs font-medium">
                  {workspace.projects.length}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#792990] to-transparent"></div>
              </div>

              <div className="grid gap-4">
                {workspace.projects.map((project) => {
          const totalIssues = project.issues.length;
          const completedIssues = project.issues.filter(
            (issue) => issue.status.type === "DONE"
          ).length;
          const progress =
            totalIssues > 0
              ? Math.round((completedIssues / totalIssues) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="group relative rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-6 transition-all hover:border-[#792990]/40 hover:from-[#792990]/10 hover:to-[#792990]/5"
            >
              <Link href={`/projects/${project.id}`} className="block">
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-20">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-[#FFB947] transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-gray-400">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-6 border ${
                        project.status === "IN_PROGRESS"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : project.status === "COMPLETED"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : project.status === "PLANNED"
                          ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
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
                      <span className="text-gray-400">
                        {completedIssues} of {totalIssues} completed
                      </span>
                      <span className="font-medium text-gray-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#792990]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#FFB947] to-[#792990] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {project.startDate && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          Start: <DateDisplay date={project.startDate} />
                        </span>
                      </div>
                    )}
                    {project.targetDate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          Target: <DateDisplay date={project.targetDate} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingProject(project);
                  }}
                  className="h-8 w-8 bg-[#350459]/90 hover:bg-[#792990]/50 text-gray-300 hover:text-gray-100 border border-[#792990]/30"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingProject(project);
                  }}
                  className="h-8 w-8 bg-[#350459]/90 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#792990]/30 hover:border-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
              </div>
            </div>
          );
        })}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          projectId={deletingProject.id}
          projectName={deletingProject.name}
          open={!!deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
        />
      )}
    </>
  );
}
