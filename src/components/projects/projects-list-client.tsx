"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  GripVertical,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateDisplay } from "@/components/ui/date-display";
import {
  clampPage,
  pageCount,
  pageSlice,
  projectMatchesQuery,
} from "@/lib/project-list";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  sortOrder: number;
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

interface SortableProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  /** Off while a search filter is active — the visible cards are no longer a
   *  contiguous slice of the workspace order, so a drop has no sane meaning. */
  draggable: boolean;
}

function SortableProjectCard({
  project,
  onEdit,
  onDelete,
  draggable,
}: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border border-[#792990]/40 bg-gradient-to-br from-[#792990]/15 via-[#792990]/10 to-[#792990]/5 p-6 transition-all hover:border-[#792990]/60 hover:from-[#792990]/20 hover:via-[#792990]/15 hover:to-[#792990]/10 hover:shadow-lg hover:shadow-[#792990]/10"
    >
      {/* Drag Handle */}
      {draggable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-[#FFB947]" />
        </div>
      )}

      <Link href={`/projects/${project.id}`} className="block pl-6">
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
                  ? "bg-[#792990]/20 text-[#FFB947] border-[#792990]/40"
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
                className="h-full bg-[#792990] transition-all"
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
            onEdit(project);
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
            onDelete(project);
          }}
          className="h-8 w-8 bg-[#350459]/90 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-[#792990]/30 hover:border-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProjectsListClient({ workspacesWithProjects }: ProjectsListClientProps) {
  const [workspaces, setWorkspaces] = useState(workspacesWithProjects);
  // The server prop is the source of truth; local state exists only to hold the optimistic
  // order while dragging. Re-sync whenever a new RSC payload arrives (router.refresh() after
  // create/edit/delete), otherwise the list keeps the snapshot taken on mount and a new
  // project only shows up after a full page reload.
  const [syncedProjects, setSyncedProjects] = useState(workspacesWithProjects);
  if (syncedProjects !== workspacesWithProjects) {
    setSyncedProjects(workspacesWithProjects);
    setWorkspaces(workspacesWithProjects);
  }

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalProjects = workspaces.reduce(
    (sum, ws) => sum + ws.projects.length,
    0
  );

  const isSearching = search.trim() !== "";

  // Filter, then flatten to one ordered list so pages have a stable size no matter
  // how the projects split across workspaces. Flattening keeps workspaces contiguous,
  // so each page still renders as whole workspace sections.
  const matches = useMemo(
    () =>
      workspaces.flatMap((workspace) =>
        workspace.projects
          .filter((project) => projectMatchesQuery(project, search))
          .map((project) => ({ workspace, project }))
      ),
    [workspaces, search]
  );

  const totalPages = pageCount(matches.length);
  // Derived, not stored: a filter that shrinks the list must not strand the user
  // on a page that no longer exists.
  const currentPage = clampPage(page, totalPages);
  const visible = pageSlice(matches, currentPage);

  // Regroup the current page back into workspace sections, preserving order.
  const visibleGroups: Array<{
    workspace: WorkspaceWithProjects;
    projects: Project[];
  }> = [];
  for (const { workspace, project } of visible) {
    const last = visibleGroups[visibleGroups.length - 1];
    if (last && last.workspace.id === workspace.id) {
      last.projects.push(project);
    } else {
      visibleGroups.push({ workspace, projects: [project] });
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const createHandleDragEnd = (workspaceId: string) => {
    return async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const wsIndex = workspaces.findIndex((ws) => ws.id === workspaceId);
      if (wsIndex === -1) return;

      // Move within the workspace's FULL project list, not the visible page.
      // The page is a contiguous slice of that list, so moving within it is the
      // same operation — and /api/projects/reorder writes sortOrder = index over
      // whatever array it gets, so sending only the visible slice would reset the
      // order of every project on the other pages.
      const projects = workspaces[wsIndex].projects;
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newProjects = arrayMove(projects, oldIndex, newIndex);
      const newWorkspaces = [...workspaces];
      newWorkspaces[wsIndex] = { ...newWorkspaces[wsIndex], projects: newProjects };
      setWorkspaces(newWorkspaces);

      try {
        const sortedProjectIds = newProjects.map((p) => p.id);

        await fetch("/api/projects/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: active.id,
            sortedProjectIds,
          }),
        });
      } catch {
        // Revert on error
        setWorkspaces(workspaces);
      }
    };
  };

  if (totalProjects === 0) {
    return (
      <div className="rounded-lg border border-[#792990]/20 bg-[#792990]/5 p-12 text-center">
        <p className="text-gray-300">No projects yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search projects by name..."
            aria-label="Search projects by name"
            className="border-[#792990]/30 bg-[#792990]/10 pl-9 pr-9 text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:ring-[#FFB947]"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:bg-[#792990]/30 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-400" aria-live="polite">
          {isSearching
            ? `${matches.length} of ${totalProjects} project${
                totalProjects !== 1 ? "s" : ""
              }`
            : `${totalProjects} project${totalProjects !== 1 ? "s" : ""}`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-[#792990]/20 bg-[#792990]/5 p-12 text-center">
          <p className="text-gray-300">
            No projects match &ldquo;{search.trim()}&rdquo;
          </p>
          <Button
            variant="outline"
            onClick={() => handleSearchChange("")}
            className="mt-4 border-[#792990]/30 bg-[#792990]/10 text-gray-300 hover:bg-[#792990]/20"
          >
            Show all projects
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map(({ workspace, projects }) => (
            <div key={workspace.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-[#792990] to-transparent"></div>
                <span className="text-2xl">{workspace.icon || "🏢"}</span>
                <h2 className="text-xl font-semibold text-gray-100">
                  {workspace.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#792990]/20 text-gray-400 text-xs font-medium">
                  {projects.length}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#792990] to-transparent"></div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={createHandleDragEnd(workspace.id)}
              >
                <SortableContext
                  items={projects.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {projects.map((project) => (
                      <SortableProjectCard
                        key={project.id}
                        project={project}
                        onEdit={setEditingProject}
                        onDelete={setDeletingProject}
                        draggable={!isSearching}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Projects pagination"
          className="mt-8 flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-[#792990]/30 bg-[#792990]/10 text-gray-300 hover:bg-[#792990]/20 disabled:opacity-40"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-400" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-[#792990]/30 bg-[#792990]/10 text-gray-300 hover:bg-[#792990]/20 disabled:opacity-40"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}

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
