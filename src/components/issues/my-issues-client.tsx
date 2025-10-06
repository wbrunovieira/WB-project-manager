"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Circle, CircleDot, CheckCircle2, XCircle, AlertCircle, Edit, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { EditIssueModal } from "@/components/issues/edit-issue-modal";
import { DeleteIssueDialog } from "@/components/issues/delete-issue-dialog";
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
import { useRouter } from "next/navigation";

interface Issue {
  id: string;
  identifier: string;
  title: string;
  priority: string;
  status: {
    name: string;
    type: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
  milestone?: {
    id: string;
    name: string;
  } | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  labels?: Array<{
    labelId: string;
    label: {
      name: string;
      color: string;
    };
  }>;
}

interface MyIssuesClientProps {
  issues: Issue[];
  statuses: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; name: string }>;
  workspaceId: string;
}

type GroupBy = "none" | "project" | "milestone" | "status" | "priority" | "label";

interface SortableIssueRowProps {
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityIcon: (priority: string) => JSX.Element;
  getStatusIcon: (statusType: string) => JSX.Element;
}

function SortableIssueRow({
  issue,
  onEdit,
  onDelete,
  getPriorityColor,
  getPriorityIcon,
  getStatusIcon,
}: SortableIssueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <Link href={`/issues/${issue.id}`} className="flex items-center gap-2 flex-1">
              <span className="text-sm font-mono text-gray-500">
                #{issue.identifier}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {issue.title}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(issue)} className="h-8 w-8">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(issue)} className="h-8 w-8 text-red-600 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(issue.status.type)}
          <span className="text-sm text-gray-600">{issue.status.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-1 ${getPriorityColor(issue.priority)}`}>
          {getPriorityIcon(issue.priority)}
          <span className="text-sm font-medium">
            {issue.priority === "NO_PRIORITY" ? "No Priority" : issue.priority}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              {issue.assignee.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
            <span className="text-sm text-gray-600">
              {issue.assignee.name || issue.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1 flex-wrap">
          {issue.labels?.map((issueLabel) => (
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
        </div>
      </td>
      <td className="px-6 py-4">
        {issue.milestone ? (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
            {issue.milestone.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        {issue.project ? (
          <Link
            href={`/projects/${issue.project.id}`}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            {issue.project.name}
          </Link>
        ) : (
          <span className="text-sm text-gray-400">No project</span>
        )}
      </td>
    </tr>
  );
}

export function MyIssuesClient({
  issues: initialIssues,
  statuses,
  users,
  projects,
  milestones,
  workspaceId,
}: MyIssuesClientProps) {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [subGroupBy, setSubGroupBy] = useState<GroupBy>("none");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600";
      case "HIGH":
        return "text-orange-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <AlertCircle className="h-4 w-4" />;
      case "HIGH":
        return <CircleDot className="h-4 w-4" />;
      case "MEDIUM":
        return <Circle className="h-4 w-4" />;
      case "LOW":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGroupKey = (issue: Issue, groupType: GroupBy): string => {
    switch (groupType) {
      case "project":
        return issue.project?.name || "No Project";
      case "milestone":
        return issue.milestone?.name || "No Milestone";
      case "status":
        return issue.status.name;
      case "priority":
        return issue.priority;
      case "label":
        return issue.labels && issue.labels.length > 0
          ? issue.labels[0].label.name
          : "No Label";
      default:
        return "all";
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = issues.findIndex((issue) => issue.id === active.id);
    const newIndex = issues.findIndex((issue) => issue.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newIssues = arrayMove(issues, oldIndex, newIndex);
    setIssues(newIssues);

    // Update sortOrder in the backend
    try {
      await fetch("/api/issues/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: active.id,
          newIndex,
        }),
      });
    } catch (error) {
      console.error("Failed to update issue order:", error);
      // Revert on error
      setIssues(issues);
    }
  };

  const groupedIssues = useMemo(() => {
    if (groupBy === "none") {
      return { all: issues };
    }

    const groups: Record<string, Issue[]> = {};
    issues.forEach((issue) => {
      const key = getGroupKey(issue, groupBy);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(issue);
    });

    // If subgrouping is enabled
    if (subGroupBy !== "none") {
      const nestedGroups: Record<string, Record<string, Issue[]>> = {};
      Object.entries(groups).forEach(([groupKey, groupIssues]) => {
        nestedGroups[groupKey] = {};
        groupIssues.forEach((issue) => {
          const subKey = getGroupKey(issue, subGroupBy);
          if (!nestedGroups[groupKey][subKey]) {
            nestedGroups[groupKey][subKey] = [];
          }
          nestedGroups[groupKey][subKey].push(issue);
        });
      });
      return nestedGroups;
    }

    return groups;
  }, [issues, groupBy, subGroupBy]);

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Issues</h1>
          <p className="mt-2 text-gray-600">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Grouping Controls */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Group by:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="project">Project</option>
            <option value="milestone">Milestone</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="label">Label</option>
          </select>
        </div>

        {groupBy !== "none" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Then by:</label>
            <select
              value={subGroupBy}
              onChange={(e) => setSubGroupBy(e.target.value as GroupBy)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              {groupBy !== "project" && <option value="project">Project</option>}
              {groupBy !== "milestone" && <option value="milestone">Milestone</option>}
              {groupBy !== "status" && <option value="status">Status</option>}
              {groupBy !== "priority" && <option value="priority">Priority</option>}
              {groupBy !== "label" && <option value="label">Label</option>}
            </select>
          </div>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">No issues yet</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Issue
          </Button>
        </div>
      ) : groupBy === "none" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Milestone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Project
                  </th>
                </tr>
              </thead>
              <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {issues.map((issue) => (
                    <SortableIssueRow
                      key={issue.id}
                      issue={issue}
                      onEdit={setEditingIssue}
                      onDelete={setDeletingIssue}
                      getPriorityColor={getPriorityColor}
                      getPriorityIcon={getPriorityIcon}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      ) : subGroupBy === "none" ? (
        <div className="space-y-6">
          {Object.entries(groupedIssues as Record<string, Issue[]>).map(([groupKey, groupIssues]) => (
            <DndContext key={groupKey} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="bg-gray-50 px-6 py-3">
                  <h3 className="font-semibold text-gray-900">
                    {groupKey} ({groupIssues.length})
                  </h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Labels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Milestone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <SortableContext items={groupIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {groupIssues.map((issue) => (
                        <SortableIssueRow
                          key={issue.id}
                          issue={issue}
                          onEdit={setEditingIssue}
                          onDelete={setDeletingIssue}
                          getPriorityColor={getPriorityColor}
                          getPriorityIcon={getPriorityIcon}
                          getStatusIcon={getStatusIcon}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </DndContext>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIssues as Record<string, Record<string, Issue[]>>).map(
            ([groupKey, subGroups]) => (
              <div key={groupKey} className="rounded-lg border border-gray-200 bg-white">
                <div className="bg-gray-100 px-6 py-3">
                  <h2 className="text-lg font-semibold text-gray-900">{groupKey}</h2>
                </div>
                <div className="space-y-4 p-4">
                  {Object.entries(subGroups).map(([subKey, subIssues]) => (
                    <DndContext key={subKey} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <div className="bg-gray-50 px-6 py-2">
                          <h3 className="font-medium text-gray-900">
                            {subKey} ({subIssues.length})
                          </h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Issue
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Priority
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Assignee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Labels
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Milestone
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Project
                              </th>
                            </tr>
                          </thead>
                          <SortableContext items={subIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {subIssues.map((issue) => (
                                <SortableIssueRow
                                  key={issue.id}
                                  issue={issue}
                                  onEdit={setEditingIssue}
                                  onDelete={setDeletingIssue}
                                  getPriorityColor={getPriorityColor}
                                  getPriorityIcon={getPriorityIcon}
                                  getStatusIcon={getStatusIcon}
                                />
                              ))}
                            </tbody>
                          </SortableContext>
                        </table>
                      </div>
                    </DndContext>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <CreateIssueModal
        statuses={statuses}
        users={users}
        projects={projects}
        milestones={milestones}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        workspaceId={workspaceId}
      />

      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          statuses={statuses}
          users={users}
          projects={projects}
          milestones={milestones}
          open={!!editingIssue}
          onOpenChange={(open) => !open && setEditingIssue(null)}
        />
      )}

      {deletingIssue && (
        <DeleteIssueDialog
          issueId={deletingIssue.id}
          issueTitle={deletingIssue.title}
          issueKey={`#${deletingIssue.identifier}`}
          open={!!deletingIssue}
          onOpenChange={(open) => !open && setDeletingIssue(null)}
        />
      )}
    </>
  );
}
