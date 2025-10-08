"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, GripVertical, Circle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Target, User, Calendar, Clock, AlertCircle, Lock, MoreVertical, ArrowUp, ArrowDown, Copy, Link2, Files } from "lucide-react";
import { TimerButton } from "@/components/time-tracker/timer-button";
import { IssueTimeDisplay } from "@/components/time-tracker/issue-time-display";
import { SLAIndicator } from "@/components/issues/sla-indicator";
import { useTimeTracker } from "@/contexts/time-tracker-context";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface ProjectIssuesClientProps {
  projectId: string;
  issuesByStatus: Record<string, any[]>;
  totalIssues: number;
  statuses: Array<{ id: string; name: string; type: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  milestones?: Array<{ id: string; name: string }>;
  workspaceId: string;
}

interface SortableIssueCardProps {
  issue: any;
  statuses: Array<{ id: string; name: string; type: string }>;
  milestones: Array<{ id: string; name: string }>;
  onEdit: (issue: any) => void;
  onDelete: (issue: any) => void;
  onStatusChange: (issueId: string, statusId: string) => void;
  onMilestoneChange: (issueId: string, milestoneId: string | null) => void;
  onMoveToTop: (issueId: string) => void;
  onMoveToBottom: (issueId: string) => void;
  onCopyLink: (issue: any) => void;
  onDuplicate: (issue: any) => void;
}

function SortableIssueCard({
  issue,
  statuses,
  milestones,
  onEdit,
  onDelete,
  onStatusChange,
  onMilestoneChange,
  onMoveToTop,
  onMoveToBottom,
  onCopyLink,
  onDuplicate,
}: SortableIssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isIssueTracking } = useTimeTracker();
  const isTimerActive = isIssueTracking(issue.id);

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

  const isInProgress = issue.status.type === "IN_PROGRESS";
  const isDone = issue.status.type === "DONE";
  const isCanceled = issue.status.type === "CANCELED";

  // Calculate fade based on how long ago it was completed
  const getCompletionFade = () => {
    if (!isDone || !issue.resolvedAt) return 1;
    const daysSinceResolved = Math.floor((Date.now() - new Date(issue.resolvedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceResolved > 7) return 0.7;
    if (daysSinceResolved > 3) return 0.85;
    return 0.95;
  };

  const getCardStyles = () => {
    if (isInProgress) {
      return "border-[#FFB947]/70 bg-gradient-to-r from-[#FFB947]/20 via-[#FFB947]/15 to-[#FFB947]/10 shadow-lg shadow-[#FFB947]/20 hover:border-[#FFB947] hover:from-[#FFB947]/25 hover:via-[#FFB947]/20 hover:to-[#FFB947]/15 hover:shadow-xl hover:shadow-[#FFB947]/30";
    }
    if (isDone) {
      return "border-[#10b981]/30 bg-gradient-to-r from-[#10b981]/10 via-[#10b981]/5 to-transparent hover:border-[#10b981]/50 hover:from-[#10b981]/15 hover:via-[#10b981]/10";
    }
    if (isCanceled) {
      return "border-[#ef4444]/30 bg-gradient-to-r from-[#ef4444]/10 via-[#ef4444]/5 to-transparent opacity-75 hover:border-[#ef4444]/50";
    }
    return "border-[#792990]/40 bg-gradient-to-r from-[#792990]/15 via-[#792990]/10 to-[#792990]/5 hover:border-[#FFB947]/70 hover:from-[#792990]/25 hover:via-[#792990]/20 hover:to-[#792990]/10 hover:shadow-lg hover:shadow-[#792990]/10";
  };

  const completionFade = getCompletionFade();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={{ ...style, opacity: completionFade }}
          className={`group rounded-xl border-2 transition-all ${getCardStyles()}`}
        >
          <div className="flex items-center gap-4 p-5">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-[#FFB947]" />
        </div>

        <div className="flex flex-1 items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 shrink-0 text-gray-400 hover:text-[#FFB947] transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {isInProgress && (
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#FFB947] opacity-30"></div>
              <div className="relative h-2 w-2 rounded-full bg-[#FFB947]"></div>
            </div>
          )}
          {isDone && (
            <CheckCircle2 className="h-4 w-4 text-[#10b981] shrink-0" />
          )}
          {isCanceled && (
            <XCircle className="h-4 w-4 text-[#ef4444] shrink-0" />
          )}
          <span className="text-sm font-mono font-semibold text-[#FFB947] shrink-0">
            #{issue.identifier}
          </span>
          <span className={`text-base font-semibold ${
            isInProgress ? "text-[#FFB947]" :
            isDone ? "text-gray-300" :
            isCanceled ? "text-gray-400 line-through" :
            "text-gray-100"
          }`}>
            {issue.title}
          </span>

          {/* Resolution Time Badge for Done issues */}
          {isDone && issue.resolutionTimeMinutes && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#10b981]/20 px-2 py-1 text-xs font-medium text-[#10b981] border border-[#10b981]/30">
              <Clock className="h-3 w-3" />
              Resolved in {Math.floor(issue.resolutionTimeMinutes / 60)}h {issue.resolutionTimeMinutes % 60}m
            </span>
          )}

          {/* High Priority Trophy for Done issues */}
          {isDone && (issue.priority === "URGENT" || issue.priority === "HIGH") && (
            <span className="inline-flex items-center text-yellow-500" title="High priority completed!">
              🏆
            </span>
          )}

          {/* Completion Timestamp */}
          {isDone && issue.resolvedAt && (
            <span className="text-xs text-gray-400 shrink-0">
              Completed {(() => {
                const days = Math.floor((Date.now() - new Date(issue.resolvedAt).getTime()) / (1000 * 60 * 60 * 24));
                if (days === 0) return "today";
                if (days === 1) return "yesterday";
                if (days < 7) return `${days} days ago`;
                if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
                return `${Math.floor(days / 30)} months ago`;
              })()}
            </span>
          )}

          <SLAIndicator issue={issue} compact />
        </div>

      <div className="flex items-center gap-3">
        {/* Time Display */}
        <IssueTimeDisplay issueId={issue.id} />

        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isTimerActive}>
            <button
              className={`group/btn flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isTimerActive
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#792990]/20"
              }`}
              disabled={isTimerActive}
              title={isTimerActive ? "Stop timer to change status" : "Change status"}
            >
              {getStatusIcon(issue.status.type)}
              <span className="text-gray-300">{issue.status.name}</span>
              {isTimerActive ? (
                <Lock className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover/btn:text-gray-300" />
              )}
            </button>
          </DropdownMenuTrigger>
          {!isTimerActive && (
            <DropdownMenuContent align="start" className="w-48">
              {statuses.map((status) => (
                <DropdownMenuItem
                  key={status.id}
                  onClick={() => onStatusChange(issue.id, status.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {getStatusIcon(status.type)}
                  <span>{status.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>

        {/* Labels */}
        {issue.labels.map((issueLabel: any) => (
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
        ))}

        {/* Milestone Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isTimerActive}>
            <button
              className={`group/btn flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isTimerActive
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#792990]/20"
              }`}
              disabled={isTimerActive}
              title={isTimerActive ? "Stop timer to change milestone" : "Change milestone"}
            >
              <Target className="h-3.5 w-3.5 text-[#FFB947]" />
              <span className="text-gray-300">
                {issue.milestone?.name || "No milestone"}
              </span>
              {isTimerActive ? (
                <Lock className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover/btn:text-gray-300" />
              )}
            </button>
          </DropdownMenuTrigger>
          {!isTimerActive && (
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => onMilestoneChange(issue.id, null)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-gray-500">No milestone</span>
              </DropdownMenuItem>
              {milestones.map((milestone) => (
                <DropdownMenuItem
                  key={milestone.id}
                  onClick={() => onMilestoneChange(issue.id, milestone.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Target className="h-3.5 w-3.5 text-gray-400" />
                  <span>{milestone.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>

        {/* Priority */}
        {issue.priority !== "NO_PRIORITY" && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              issue.priority === "URGENT"
                ? "bg-red-50 text-red-700"
                : issue.priority === "HIGH"
                ? "bg-orange-50 text-orange-700"
                : issue.priority === "MEDIUM"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {issue.priority}
          </span>
        )}

        {/* Assignee */}
        {issue.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white shadow-sm">
              {issue.assignee.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <TimerButton
            issueId={issue.id}
            issueIdentifier={issue.identifier}
            issueTitle={issue.title}
            issueStatusType={issue.status.type}
            size="icon"
          />

          {/* Kebab Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-[#792990]/20"
                title="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onMoveToTop(issue.id)} className="cursor-pointer">
                <ArrowUp className="mr-2 h-4 w-4" />
                Move to Top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMoveToBottom(issue.id)} className="cursor-pointer">
                <ArrowDown className="mr-2 h-4 w-4" />
                Move to Bottom
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDuplicate(issue)} className="cursor-pointer">
                <Files className="mr-2 h-4 w-4" />
                Duplicate Issue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyLink(issue)} className="cursor-pointer">
                <Link2 className="mr-2 h-4 w-4" />
                Copy Issue Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => !isTimerActive && onEdit(issue)}
                disabled={isTimerActive}
                className="cursor-pointer"
              >
                {isTimerActive ? <Lock className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => !isTimerActive && onDelete(issue)}
                disabled={isTimerActive}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                {isTimerActive ? <Lock className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-[#792990]/30 bg-[#792990]/5 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x lg:divide-[#792990]/30">
            {/* Left Column - Description */}
            <div className="space-y-3 lg:pr-8">
              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#FFB947]" />
                Description
              </h4>
              <div className="pl-6">
                <p className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap">
                  {issue.description || "No description provided"}
                </p>
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-4 lg:pl-8">
              <h4 className="text-sm font-semibold text-gray-300">Details</h4>
              <div className="grid grid-cols-2 gap-4 pl-6">
            {/* Type */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400">Type</p>
              <p className="text-sm text-gray-200">{issue.type}</p>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400">Priority</p>
              <p className="text-sm text-gray-200">{issue.priority || "NO_PRIORITY"}</p>
            </div>

            {/* Creator */}
            {issue.creator && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Creator
                </p>
                <p className="text-sm text-gray-200">{issue.creator.name || issue.creator.email}</p>
              </div>
            )}

            {/* Assignee */}
            {issue.assignee && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assignee
                </p>
                <p className="text-sm text-gray-200">{issue.assignee.name || issue.assignee.email}</p>
              </div>
            )}

            {/* Created At */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="text-sm text-gray-200">
                {new Date(issue.createdAt).toLocaleDateString()} {new Date(issue.createdAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Updated At */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated
              </p>
              <p className="text-sm text-gray-200">
                {new Date(issue.updatedAt).toLocaleDateString()} {new Date(issue.updatedAt).toLocaleTimeString()}
              </p>
            </div>

            {/* Reported At */}
            {issue.reportedAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Reported
                </p>
                <p className="text-sm text-gray-200">
                  {new Date(issue.reportedAt).toLocaleDateString()} {new Date(issue.reportedAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* First Response */}
            {issue.firstResponseAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  First Response
                </p>
                <p className="text-sm text-gray-200">
                  {new Date(issue.firstResponseAt).toLocaleDateString()} {new Date(issue.firstResponseAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Resolved At */}
            {issue.resolvedAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved
                </p>
                <p className="text-sm text-gray-200">
                  {new Date(issue.resolvedAt).toLocaleDateString()} {new Date(issue.resolvedAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Resolution Time */}
            {issue.resolutionTimeMinutes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400">Resolution Time</p>
                <p className="text-sm text-gray-200">
                  {Math.floor(issue.resolutionTimeMinutes / 60)}h {issue.resolutionTimeMinutes % 60}m
                </p>
              </div>
            )}

            {/* Reopen Count */}
            {issue.reopenCount > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400">Reopened</p>
                <p className="text-sm text-gray-200">{issue.reopenCount} times</p>
              </div>
            )}
              </div>

              {/* Labels */}
              {issue.labels.length > 0 && (
                <div className="space-y-2 pl-6">
                  <p className="text-xs font-medium text-gray-400">Labels</p>
                  <div className="flex flex-wrap gap-2">
                    {issue.labels.map((issueLabel: any) => (
                      <span
                        key={issueLabel.labelId}
                        className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium shadow-sm"
                        style={{
                          backgroundColor: `${issueLabel.label.color}15`,
                          color: issueLabel.label.color,
                          border: `1px solid ${issueLabel.label.color}40`,
                        }}
                      >
                        {issueLabel.label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onMoveToTop(issue.id)} className="cursor-pointer">
          <ArrowUp className="mr-2 h-4 w-4" />
          Move to Top
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMoveToBottom(issue.id)} className="cursor-pointer">
          <ArrowDown className="mr-2 h-4 w-4" />
          Move to Bottom
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDuplicate(issue)} className="cursor-pointer">
          <Files className="mr-2 h-4 w-4" />
          Duplicate Issue
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopyLink(issue)} className="cursor-pointer">
          <Link2 className="mr-2 h-4 w-4" />
          Copy Issue Link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => !isTimerActive && onEdit(issue)}
          disabled={isTimerActive}
          className="cursor-pointer"
        >
          {isTimerActive ? <Lock className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => !isTimerActive && onDelete(issue)}
          disabled={isTimerActive}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          {isTimerActive ? <Lock className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ProjectIssuesClient({
  projectId,
  issuesByStatus: initialIssuesByStatus,
  totalIssues,
  statuses,
  users,
  milestones,
  workspaceId,
}: ProjectIssuesClientProps) {
  const router = useRouter();
  const [issuesByStatus, setIssuesByStatus] = useState(initialIssuesByStatus);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<any | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<any | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync internal state with props when they change (e.g., milestone filter)
  useEffect(() => {
    setIssuesByStatus(initialIssuesByStatus);
  }, [initialIssuesByStatus]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createHandleDragEnd = (statusType: string) => {
    return async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const issues = issuesByStatus[statusType];
      const oldIndex = issues.findIndex((i: any) => i.id === active.id);
      const newIndex = issues.findIndex((i: any) => i.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newIssues = arrayMove(issues, oldIndex, newIndex);
      const updatedIssuesByStatus = {
        ...issuesByStatus,
        [statusType]: newIssues,
      };
      setIssuesByStatus(updatedIssuesByStatus);

      try {
        // Send all sorted issue IDs to maintain correct order
        const sortedIssueIds = newIssues.map((i: any) => i.id);

        await fetch("/api/issues/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: active.id,
            statusType,
            sortedIssueIds,
          }),
        });
      } catch (error) {
        console.error("Failed to update issue order:", error);
        setIssuesByStatus(issuesByStatus);
      }
    };
  };

  const handleStatusChange = async (issueId: string, statusId: string) => {
    // Find the issue and its current status
    let currentIssue: any = null;
    let currentStatusType: string = "";

    for (const [statusType, issues] of Object.entries(issuesByStatus)) {
      const issue = issues.find((i: any) => i.id === issueId);
      if (issue) {
        currentIssue = issue;
        currentStatusType = statusType;
        break;
      }
    }

    if (!currentIssue) return;

    // Find the new status
    const newStatus = statuses.find((s) => s.id === statusId);
    if (!newStatus) return;

    // Optimistically update the UI
    const updatedIssue = {
      ...currentIssue,
      statusId,
      status: newStatus,
    };

    // Use the status type directly
    const newStatusType = newStatus.type;

    // Update state optimistically
    const newIssuesByStatus = { ...issuesByStatus };

    // Remove from old status
    newIssuesByStatus[currentStatusType] = newIssuesByStatus[currentStatusType].filter(
      (i: any) => i.id !== issueId
    );

    // Add to new status
    if (!newIssuesByStatus[newStatusType]) {
      newIssuesByStatus[newStatusType] = [];
    }
    newIssuesByStatus[newStatusType] = [...newIssuesByStatus[newStatusType], updatedIssue];

    setIssuesByStatus(newIssuesByStatus);

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh to get updated data from server
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on error
      setIssuesByStatus(initialIssuesByStatus);
    }
  };

  const toggleGroupCollapse = (statusType: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(statusType)) {
        newSet.delete(statusType);
      } else {
        newSet.add(statusType);
      }
      return newSet;
    });
  };

  // Filter issues by type
  const filteredIssuesByStatus = useMemo(() => {
    if (typeFilter === "all") {
      return issuesByStatus;
    }

    const filtered: Record<string, any[]> = {};
    for (const [statusType, issues] of Object.entries(issuesByStatus)) {
      filtered[statusType] = issues.filter((issue: any) => issue.type === typeFilter);
    }
    return filtered;
  }, [issuesByStatus, typeFilter]);

  const handleMilestoneChange = async (issueId: string, milestoneId: string | null) => {
    // Find the issue
    let currentIssue: any = null;
    let currentStatusType: string = "";

    for (const [statusType, issues] of Object.entries(issuesByStatus)) {
      const issue = issues.find((i: any) => i.id === issueId);
      if (issue) {
        currentIssue = issue;
        currentStatusType = statusType;
        break;
      }
    }

    if (!currentIssue) return;

    // Find the milestone
    const milestone = milestoneId ? milestones?.find((m) => m.id === milestoneId) : null;

    // Optimistically update the UI
    const updatedIssue = {
      ...currentIssue,
      milestoneId,
      milestone: milestone || null,
    };

    // Update state optimistically
    const newIssuesByStatus = { ...issuesByStatus };
    newIssuesByStatus[currentStatusType] = newIssuesByStatus[currentStatusType].map((i: any) =>
      i.id === issueId ? updatedIssue : i
    );

    setIssuesByStatus(newIssuesByStatus);

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update milestone");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update milestone:", error);
      // Revert on error
      setIssuesByStatus(initialIssuesByStatus);
    }
  };

  const handleMoveToTop = async (issueId: string) => {
    // Find the issue and its status type
    let currentStatusType: string = "";

    for (const [statusType, issues] of Object.entries(issuesByStatus)) {
      const issue = issues.find((i: any) => i.id === issueId);
      if (issue) {
        currentStatusType = statusType;
        break;
      }
    }

    if (!currentStatusType) return;

    const issues = issuesByStatus[currentStatusType];
    const currentIndex = issues.findIndex((i: any) => i.id === issueId);

    if (currentIndex === -1 || currentIndex === 0) return; // Already at top

    // Move to top
    const newIssues = arrayMove(issues, currentIndex, 0);
    const updatedIssuesByStatus = {
      ...issuesByStatus,
      [currentStatusType]: newIssues,
    };
    setIssuesByStatus(updatedIssuesByStatus);

    try {
      const sortedIssueIds = newIssues.map((i: any) => i.id);

      await fetch("/api/issues/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          statusType: currentStatusType,
          sortedIssueIds,
        }),
      });
    } catch (error) {
      console.error("Failed to move issue to top:", error);
      setIssuesByStatus(issuesByStatus);
    }
  };

  const handleMoveToBottom = async (issueId: string) => {
    // Find the issue and its status type
    let currentStatusType: string = "";

    for (const [statusType, issues] of Object.entries(issuesByStatus)) {
      const issue = issues.find((i: any) => i.id === issueId);
      if (issue) {
        currentStatusType = statusType;
        break;
      }
    }

    if (!currentStatusType) return;

    const issues = issuesByStatus[currentStatusType];
    const currentIndex = issues.findIndex((i: any) => i.id === issueId);
    const lastIndex = issues.length - 1;

    if (currentIndex === -1 || currentIndex === lastIndex) return; // Already at bottom

    // Move to bottom
    const newIssues = arrayMove(issues, currentIndex, lastIndex);
    const updatedIssuesByStatus = {
      ...issuesByStatus,
      [currentStatusType]: newIssues,
    };
    setIssuesByStatus(updatedIssuesByStatus);

    try {
      const sortedIssueIds = newIssues.map((i: any) => i.id);

      await fetch("/api/issues/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          statusType: currentStatusType,
          sortedIssueIds,
        }),
      });
    } catch (error) {
      console.error("Failed to move issue to bottom:", error);
      setIssuesByStatus(issuesByStatus);
    }
  };

  const handleCopyIssueLink = async (issue: any) => {
    const issueUrl = `${window.location.origin}/projects/${projectId}?issue=${issue.identifier}`;
    try {
      await navigator.clipboard.writeText(issueUrl);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDuplicateIssue = async (issue: any) => {
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${issue.title} (Copy)`,
          description: issue.description,
          type: issue.type,
          priority: issue.priority,
          statusId: issue.statusId,
          projectId: issue.projectId,
          milestoneId: issue.milestoneId,
          workspaceId: issue.workspaceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate issue");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to duplicate issue:", error);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Issues</h2>
        <div className="flex items-center gap-4">
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
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#FFB947] text-gray-900 hover:bg-[#FFB947]/90">
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {Object.entries(filteredIssuesByStatus).map(([statusType, issues]) => {
          if (issues.length === 0) return null;

          const statusName =
            issues[0]?.status.name || statusType.replace("_", " ");
          const isCollapsed = collapsedGroups.has(statusType);

          return (
            <div key={statusType}>
              <button
                onClick={() => toggleGroupCollapse(statusType)}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wide hover:text-[#FFB947] transition-colors group"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:text-[#FFB947]" />
                ) : (
                  <ChevronUp className="h-4 w-4 transition-transform group-hover:text-[#FFB947]" />
                )}
                {statusName} ({issues.length})
              </button>

              {!isCollapsed && (
                <>
                  {isMounted ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={createHandleDragEnd(statusType)}
                    >
                      <SortableContext
                        items={issues.map((i: any) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {issues.map((issue) => (
                            <SortableIssueCard
                              key={issue.id}
                              issue={issue}
                              statuses={statuses}
                              milestones={milestones || []}
                              onEdit={setEditingIssue}
                              onDelete={setDeletingIssue}
                              onStatusChange={handleStatusChange}
                              onMilestoneChange={handleMilestoneChange}
                              onMoveToTop={handleMoveToTop}
                              onMoveToBottom={handleMoveToBottom}
                              onCopyLink={handleCopyIssueLink}
                              onDuplicate={handleDuplicateIssue}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="space-y-2">
                      {issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="group flex items-center gap-4 rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-4"
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <span className="text-sm font-mono text-gray-400">
                              #{issue.identifier}
                            </span>
                            <span className="text-sm font-medium text-gray-100">
                              {issue.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {totalIssues === 0 && (
          <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-12 text-center">
            <p className="text-gray-300">No issues in this project yet</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="mt-4 border-[#792990]/40 bg-[#792990]/5 text-gray-100 hover:bg-[#792990]/10 hover:border-[#792990]/60"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Issue
            </Button>
          </div>
        )}
      </div>

      <CreateIssueModal
        statuses={statuses}
        users={users}
        projects={[]}
        milestones={milestones}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        defaultProjectId={projectId}
        workspaceId={workspaceId}
      />

      {editingIssue && (
        <EditIssueModal
          issue={editingIssue}
          statuses={statuses}
          users={users}
          projects={[]}
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
