"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clampPage,
  pageCount,
  pageSlice,
  projectMatchesQuery,
} from "@/lib/project-list";
import { ProjectTargetDate } from "./project-target-date";
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

  const done = totalIssues > 0 && completedIssues === totalIssues;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col rounded-xl border border-line bg-surface-raised p-4 transition-colors hover:border-line-strong hover:bg-surface-hover"
    >
      {/* Barra de ações — some até o hover/foco para não competir com o conteúdo */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {draggable && (
          <div
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${project.name}`}
            className="cursor-grab rounded-md p-1.5 text-ink-muted hover:bg-brand/40 hover:text-ink active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${project.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(project);
          }}
          className="h-7 w-7 text-ink-muted hover:bg-brand/40 hover:text-ink"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${project.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project);
          }}
          className="h-7 w-7 text-ink-muted hover:bg-danger/20 hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="flex flex-1 flex-col gap-3 rounded-lg"
      >
        <div className="flex items-start gap-2 pr-16">
          <h3 className="line-clamp-2 flex-1 font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="line-clamp-2 -mt-1 text-sm text-ink-muted">
            {project.description}
          </p>
        )}

        {/* Progresso: o número é o protagonista e usa numerais tabulares, então
            os percentuais se alinham em coluna e o grid inteiro fica comparável
            de relance. A barra é só apoio. */}
        <div className="mt-auto pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`tabular text-2xl font-semibold leading-none ${
                done ? "text-ok" : "text-ink"
              }`}
            >
              {progress}
              <span className="text-base text-ink-muted">%</span>
            </span>
            <span className="tabular text-xs text-ink-muted">
              {completedIssues}/{totalIssues} issues
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-brand-dim">
            <div
              className={`h-full rounded-full transition-[width] ${
                done ? "bg-ok" : "bg-brand-strong"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ProjectTargetDate
          startDate={project.startDate}
          targetDate={project.targetDate}
          status={project.status}
        />
      </Link>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  PLANNED: "Planned",
  CANCELED: "Canceled",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "IN_PROGRESS"
      ? "border-accent/30 bg-accent/10 text-accent"
      : status === "COMPLETED"
      ? "border-ok/30 bg-ok/10 text-ok"
      : status === "PLANNED"
      ? "border-line-strong bg-brand/20 text-ink-soft"
      : "border-danger/30 bg-danger/10 text-danger";

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight ${tone}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
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
      <div className="rounded-xl border border-line bg-surface-raised p-12 text-center">
        <p className="text-ink-soft">No projects yet. Create your first one to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search projects by name..."
            aria-label="Search projects by name"
            className="h-9 rounded-lg border-line bg-surface-raised pl-9 pr-9 text-ink placeholder:text-ink-muted focus:border-accent focus:ring-0"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted transition-colors hover:bg-brand/40 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="tabular text-sm text-ink-muted" aria-live="polite">
          {isSearching
            ? `${matches.length} of ${totalProjects} project${
                totalProjects !== 1 ? "s" : ""
              }`
            : `${totalProjects} project${totalProjects !== 1 ? "s" : ""}`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-raised p-12 text-center">
          <p className="text-ink-soft">
            No projects match &ldquo;{search.trim()}&rdquo;
          </p>
          <Button
            variant="outline"
            onClick={() => handleSearchChange("")}
            className="mt-4 border-line bg-surface-hover text-ink-soft hover:bg-brand/40 hover:text-ink"
          >
            Show all projects
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map(({ workspace, projects }) => (
            <div key={workspace.id}>
              {/* Cabeçalho de seção alinhado à esquerda: o nome do workspace é a
                  âncora da varredura, não um ornamento centralizado. */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base">{workspace.icon || "🏢"}</span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {workspace.name}
                </h2>
                <span className="tabular rounded bg-brand/25 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
                  {projects.length}
                </span>
                <div className="ml-1 h-px flex-1 bg-line" />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={createHandleDragEnd(workspace.id)}
              >
                <SortableContext
                  items={projects.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            className="h-9 border-line bg-surface-raised text-ink-soft hover:bg-surface-hover hover:text-ink disabled:opacity-40"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="tabular text-sm text-ink-muted" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 border-line bg-surface-raised text-ink-soft hover:bg-surface-hover hover:text-ink disabled:opacity-40"
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
