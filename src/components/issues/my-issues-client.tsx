"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Circle, CircleDot, CheckCircle2, XCircle, AlertCircle, Edit, Trash2, GripVertical, Target } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SLAIndicator } from "@/components/issues/sla-indicator";

interface Issue {
  id: string;
  identifier: string;
  title: string;
  priority: string;
  type: string;
  statusId: string;
  workspaceId: string;
  reportedAt?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  status: {
    name: string;
    type: string;
  };
  feature?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
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
  statuses: Array<{ id: string; name: string; type: string }>;
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
  onStatusChange: (issueId: string, statusId: string) => void;
  statuses: Array<{ id: string; name: string; type: string }>;
  getPriorityIcon: (priority: string) => React.ReactElement;
  getStatusIcon: (statusType: string) => React.ReactElement;
}

function SortableIssueRow({
  issue,
  onEdit,
  onDelete,
  onStatusChange,
  statuses,
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
    <tr ref={setNodeRef} style={style} className="group hover:bg-gradient-to-r hover:from-[#792990]/10 hover:to-transparent transition-all">
      <td className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-300" />
            </div>
            <Link href={`/issues/${issue.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-mono text-gray-400 shrink-0">
                #{issue.identifier}
              </span>
              <span className="text-sm font-medium text-gray-100 hover:text-[#FFB947] transition-colors truncate">
                {issue.title}
              </span>
              <div className="ml-2 shrink-0">
                <SLAIndicator issue={issue} compact />
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(issue)} className="h-8 w-8 text-gray-300 hover:text-gray-100">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(issue)} className="h-8 w-8 text-red-400 hover:text-red-300">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-[#792990]/20 border border-[#792990]/20 hover:border-[#792990]/40">
              {getStatusIcon(issue.status.type)}
              <span className="text-gray-200">{issue.status.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:text-gray-300" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-[#350459] border-[#792990]/40">
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.id}
                onClick={() => onStatusChange(issue.id, status.id)}
                className="flex items-center gap-2 cursor-pointer text-gray-200 hover:bg-[#792990]/30 focus:bg-[#792990]/30"
              >
                {getStatusIcon(status.type)}
                <span>{status.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
          issue.priority === "URGENT"
            ? "bg-red-500/10 text-red-400 border-red-500/30"
            : issue.priority === "HIGH"
            ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
            : issue.priority === "MEDIUM"
            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
            : issue.priority === "LOW"
            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
            : "bg-gray-500/10 text-gray-400 border-gray-500/30"
        }`}>
          {getPriorityIcon(issue.priority)}
          <span>{issue.priority === "NO_PRIORITY" ? "No Priority" : issue.priority}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#792990] to-[#350459] text-xs font-semibold text-white shadow-sm">
              {issue.assignee.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-gray-200">
              {issue.assignee.name || issue.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Unassigned</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1.5 flex-wrap">
          {issue.feature && (
            <div
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium bg-[#792990]/10 border-l-2 shadow-sm"
              style={{
                borderLeftColor: issue.feature.color || "#792990",
              }}
            >
              <Target className="h-3 w-3" style={{ color: issue.feature.color || "#792990" }} />
              <span className="text-gray-200">{issue.feature.name}</span>
            </div>
          )}
          {issue.labels && issue.labels.length > 0 ? (
            issue.labels.map((issueLabel) => (
              <span
                key={issueLabel.labelId}
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium shadow-sm"
                style={{
                  backgroundColor: `${issueLabel.label.color}15`,
                  color: issueLabel.label.color,
                  border: `1px solid ${issueLabel.label.color}40`,
                }}
              >
                {issueLabel.label.name}
              </span>
            ))
          ) : !issue.feature ? (
            <span className="text-xs text-gray-400 italic">No labels</span>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-4">
        {issue.milestone ? (
          <span className="inline-flex items-center rounded-full bg-[#792990]/20 px-2.5 py-1 text-xs font-medium text-purple-300 border border-[#792990]/40 shadow-sm">
            {issue.milestone.name}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">No milestone</span>
        )}
      </td>
      <td className="px-6 py-4">
        {issue.project ? (
          <Link
            href={`/projects/${issue.project.id}`}
            className="inline-flex items-center text-sm font-medium text-gray-200 hover:text-[#FFB947] transition-colors"
          >
            {issue.project.name}
          </Link>
        ) : (
          <span className="text-xs text-gray-400 italic">No project</span>
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
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleStatusChange = async (issueId: string, statusId: string) => {
    // Optimistically update UI
    const updatedIssues = issues.map((issue) =>
      issue.id === issueId
        ? { ...issue, statusId, status: statuses.find((s) => s.id === statusId) || issue.status }
        : issue
    );
    setIssues(updatedIssues);

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on error
      setIssues(issues);
    }
  };

  const handleIssueCreated = (newIssue: Record<string, unknown>) => {
    // Add the new issue to the top of the list
    setIssues([newIssue as unknown as Issue, ...issues]);
  };

  const groupedIssues = useMemo(() => {
    // Filter by type first
    const filteredIssues = typeFilter === "all"
      ? issues
      : issues.filter(issue => issue.type === typeFilter);

    if (groupBy === "none") {
      return { all: filteredIssues };
    }

    const groups: Record<string, Issue[]> = {};
    filteredIssues.forEach((issue) => {
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
  }, [issues, groupBy, subGroupBy, typeFilter]);

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Issues</h1>
          <p className="mt-2 text-gray-400">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#FFB947] text-gray-900 hover:bg-[#FFB947]/90 font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filters and Grouping Controls */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-[#792990]/40 bg-[#350459] px-3 py-2 text-sm text-gray-200 focus:border-[#792990] focus:outline-none focus:ring-2 focus:ring-[#792990]/50"
          >
            <option value="all">All Types</option>
            <option value="FEATURE">Feature</option>
            <option value="BUG">Bug</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="h-6 w-px bg-[#792990]/30"></div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Group by:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-md border border-[#792990]/40 bg-[#350459] px-3 py-2 text-sm text-gray-200 focus:border-[#792990] focus:outline-none focus:ring-2 focus:ring-[#792990]/50"
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
            <label className="text-sm font-medium text-gray-300">Then by:</label>
            <select
              value={subGroupBy}
              onChange={(e) => setSubGroupBy(e.target.value as GroupBy)}
              className="rounded-md border border-[#792990]/40 bg-[#350459] px-3 py-2 text-sm text-gray-200 focus:border-[#792990] focus:outline-none focus:ring-2 focus:ring-[#792990]/50"
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
        <div className="rounded-lg border border-[#792990]/40 bg-gradient-to-br from-[#792990]/5 to-transparent p-12 text-center">
          <p className="text-gray-300">No issues yet</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="mt-4 border-[#792990]/40 text-gray-200 hover:bg-[#792990]/20 hover:border-[#792990]/60"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Issue
          </Button>
        </div>
      ) : groupBy === "none" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-hidden rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent">
            <table className="min-w-full divide-y divide-[#792990]/20">
              <thead className="bg-[#792990]/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Milestone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                    Project
                  </th>
                </tr>
              </thead>
              <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-[#792990]/20 bg-transparent">
                  {issues.map((issue) => (
                    <SortableIssueRow
                      key={issue.id}
                      issue={issue}
                      onEdit={setEditingIssue}
                      onDelete={setDeletingIssue}
                      onStatusChange={handleStatusChange}
                      statuses={statuses}

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
              <div className="overflow-hidden rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent">
                <div className="bg-[#792990]/10 px-6 py-3 border-b border-[#792990]/20">
                  <h3 className="font-semibold text-gray-100">
                    {groupKey} ({groupIssues.length})
                  </h3>
                </div>
                <table className="min-w-full divide-y divide-[#792990]/20">
                  <thead className="bg-[#792990]/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Labels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Milestone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                        Project
                      </th>
                    </tr>
                  </thead>
                  <SortableContext items={groupIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-[#792990]/20 bg-transparent">
                      {groupIssues.map((issue) => (
                        <SortableIssueRow
                          key={issue.id}
                          issue={issue}
                          onEdit={setEditingIssue}
                          onDelete={setDeletingIssue}
                          onStatusChange={handleStatusChange}
                          statuses={statuses}
    
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
              <div key={groupKey} className="rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent">
                <div className="bg-[#792990]/20 px-6 py-3 border-b border-[#792990]/30">
                  <h2 className="text-lg font-semibold text-gray-100">{groupKey}</h2>
                </div>
                <div className="space-y-4 p-4">
                  {Object.entries(subGroups).map(([subKey, subIssues]) => (
                    <DndContext key={subKey} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <div className="overflow-hidden rounded-lg border border-[#792990]/20">
                        <div className="bg-[#792990]/10 px-6 py-2 border-b border-[#792990]/20">
                          <h3 className="font-medium text-gray-200">
                            {subKey} ({subIssues.length})
                          </h3>
                        </div>
                        <table className="min-w-full divide-y divide-[#792990]/20">
                          <thead className="bg-[#792990]/10">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Issue
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Priority
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Assignee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Labels
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Milestone
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                                Project
                              </th>
                            </tr>
                          </thead>
                          <SortableContext items={subIssues.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <tbody className="divide-y divide-[#792990]/20 bg-transparent">
                              {subIssues.map((issue) => (
                                <SortableIssueRow
                                  key={issue.id}
                                  issue={issue}
                                  onEdit={setEditingIssue}
                                  onDelete={setDeletingIssue}
                                  onStatusChange={handleStatusChange}
                                  statuses={statuses}
            
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
        onIssueCreated={handleIssueCreated}
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
          onIssueUpdated={(updatedIssue) => {
            setIssues((prev) =>
              prev.map((issue) =>
                issue.id === updatedIssue.id
                  ? { ...issue, ...updatedIssue }
                  : issue
              )
            );
          }}
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
