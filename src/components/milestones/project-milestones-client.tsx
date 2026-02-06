"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, CalendarDays, CheckCircle2, Target, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateDisplay } from "@/components/ui/date-display";
import { CreateMilestoneModal } from "./create-milestone-modal";
import { EditMilestoneModal } from "./edit-milestone-modal";
import { DeleteMilestoneDialog } from "./delete-milestone-dialog";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Milestone {
  id: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  targetDate?: Date | null;
  _count: {
    issues: number;
  };
  issues?: Array<{
    status: {
      type: string;
    };
    feature?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  }>;
}

interface ProjectMilestonesClientProps {
  projectId: string;
  milestones: Milestone[];
  selectedMilestoneId?: string | null;
  onMilestoneSelect?: (milestoneId: string | null) => void;
}

interface SortableMilestoneCardProps {
  milestone: Milestone;
  isSelected: boolean;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestone: Milestone) => void;
  onClick: () => void;
}

function SortableMilestoneCard({
  milestone,
  isSelected,
  onEdit,
  onDelete,
  onClick,
}: SortableMilestoneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalIssues = milestone._count.issues;
  const completedIssues = milestone.issues
    ? milestone.issues.filter((issue) => issue.status.type === "DONE").length
    : 0;
  const progress =
    totalIssues > 0
      ? Math.round((completedIssues / totalIssues) * 100)
      : 0;

  // Get unique features from issues
  const uniqueFeatures = milestone.issues
    ? Array.from(
        new Map(
          milestone.issues
            .filter((issue) => issue.feature)
            .map((issue) => [issue.feature!.id, issue.feature!])
        ).values()
      )
    : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`group relative rounded-xl border-2 p-6 transition-all cursor-pointer ${
        isSelected
          ? "border-[#FFB947] bg-gradient-to-br from-[#792990]/30 via-[#792990]/20 to-[#350459]/30 shadow-lg shadow-[#792990]/20 scale-[1.02]"
          : "border-[#792990]/30 bg-gradient-to-br from-[#792990]/10 via-[#792990]/5 to-transparent hover:border-[#FFB947]/60 hover:from-[#792990]/20 hover:via-[#792990]/10 hover:shadow-lg hover:shadow-[#792990]/10 hover:scale-[1.01]"
      }`}
    >
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 pr-16">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-[#FFB947]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-100">
                {milestone.name}
              </h3>
              {milestone.description && (
                <p className="mt-1 text-sm text-gray-300">
                  {milestone.description}
                </p>
              )}
            </div>
          </div>

          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(milestone);
              }}
              className="h-8 w-8 text-gray-300 hover:text-gray-100 hover:bg-[#792990]/20"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(milestone);
              }}
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-[#792990]/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-gray-300">
            {completedIssues} of {totalIssues} issues completed
          </span>
          <span className="font-medium text-gray-100">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#792990]/20">
          <div
            className="h-full bg-[#792990] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-gray-300">
        {milestone.startDate && (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-[#FFB947]" />
            <span>
              <DateDisplay date={milestone.startDate} />
            </span>
          </div>
        )}
        {milestone.targetDate && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB947]" />
            <span>
              <DateDisplay date={milestone.targetDate} />
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      {uniqueFeatures.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#792990]/20">
          <div className="flex items-center gap-2 flex-wrap">
            <Target className="h-3.5 w-3.5 text-gray-400" />
            {uniqueFeatures.map((feature) => (
              <div
                key={feature.id}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium bg-[#792990]/10 border-l-2"
                style={{ borderLeftColor: feature.color || "#792990" }}
              >
                <span className="text-gray-200">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectMilestonesClient({
  projectId,
  milestones: initialMilestones,
  selectedMilestoneId: externalSelectedMilestoneId,
  onMilestoneSelect,
}: ProjectMilestonesClientProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);

  // Use external state if provided, otherwise use internal state
  const [internalSelectedMilestoneId, setInternalSelectedMilestoneId] = useState<string | null>(null);
  const selectedMilestoneId = externalSelectedMilestoneId !== undefined ? externalSelectedMilestoneId : internalSelectedMilestoneId;
  const setSelectedMilestoneId = onMilestoneSelect || setInternalSelectedMilestoneId;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = milestones.findIndex((m) => m.id === active.id);
    const newIndex = milestones.findIndex((m) => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newMilestones = arrayMove(milestones, oldIndex, newIndex);
    setMilestones(newMilestones);

    // Update sortOrder in the backend with all sorted milestone IDs
    try {
      const sortedMilestoneIds = newMilestones.map((m) => m.id);

      await fetch("/api/milestones/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: active.id,
          sortedMilestoneIds,
        }),
      });
    } catch (error) {
      console.error("Failed to update milestone order:", error);
      // Revert on error
      setMilestones(milestones);
    }
  };

  const handleMilestoneCreated = (newMilestone: { id: string; name: string; [key: string]: unknown }) => {
    // Add the new milestone with default structure
    const milestoneWithCounts = {
      ...newMilestone,
      _count: {
        issues: 0,
      },
      issues: [],
    };
    setMilestones([milestoneWithCounts, ...milestones]);
  };

  const handleMilestoneClick = (milestoneId: string) => {
    if (selectedMilestoneId === milestoneId) {
      setSelectedMilestoneId(null); // Deselect if clicking the same milestone
    } else {
      setSelectedMilestoneId(milestoneId);
    }
  };

  const filteredMilestones = selectedMilestoneId
    ? milestones.filter((m) => m.id === selectedMilestoneId)
    : milestones;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">Milestones</h2>
            <p className="mt-1 text-sm text-gray-300">
              Track sprints and releases with milestones
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedMilestoneId && (
              <Button
                onClick={() => setSelectedMilestoneId(null)}
                variant="outline"
                size="sm"
                className="border-[#792990]/40 bg-[#792990]/5 text-gray-100 hover:bg-[#792990]/10 hover:border-[#792990]/60"
              >
                Show All
              </Button>
            )}
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="bg-[#FFB947] text-gray-900 hover:bg-[#FFB947]/90">
              <Plus className="mr-2 h-4 w-4" />
              New Milestone
            </Button>
          </div>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-300">No milestones yet</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="mt-4 border-[#792990]/40 bg-[#792990]/5 text-gray-100 hover:bg-[#792990]/10 hover:border-[#792990]/60"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Milestone
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredMilestones.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMilestones.map((milestone) => (
                <SortableMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isSelected={selectedMilestoneId === milestone.id}
                  onEdit={setEditingMilestone}
                  onDelete={setDeletingMilestone}
                  onClick={() => handleMilestoneClick(milestone.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CreateMilestoneModal
        projectId={projectId}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onMilestoneCreated={handleMilestoneCreated}
      />

      {editingMilestone && (
        <EditMilestoneModal
          milestone={editingMilestone}
          open={!!editingMilestone}
          onOpenChange={(open) => !open && setEditingMilestone(null)}
        />
      )}

      {deletingMilestone && (
        <DeleteMilestoneDialog
          milestoneId={deletingMilestone.id}
          milestoneName={deletingMilestone.name}
          open={!!deletingMilestone}
          onOpenChange={(open) => !open && setDeletingMilestone(null)}
        />
      )}
    </>
  );
}
