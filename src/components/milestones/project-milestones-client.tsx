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
import { useRouter } from "next/navigation";

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
  }>;
}

interface ProjectMilestonesClientProps {
  projectId: string;
  milestones: Milestone[];
}

interface SortableMilestoneCardProps {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestone: Milestone) => void;
}

function SortableMilestoneCard({
  milestone,
  onEdit,
  onDelete,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
    >
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 pr-16">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {milestone.name}
              </h3>
              {milestone.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {milestone.description}
                </p>
              )}
            </div>
          </div>

          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(milestone)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(milestone)}
              className="h-8 w-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
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
      <div className="flex items-center gap-4 text-xs text-gray-600">
        {milestone.startDate && (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              <DateDisplay date={milestone.startDate} />
            </span>
          </div>
        )}
        {milestone.targetDate && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              <DateDisplay date={milestone.targetDate} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectMilestonesClient({
  projectId,
  milestones: initialMilestones,
}: ProjectMilestonesClientProps) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);

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

    // Update sortOrder in the backend
    try {
      await fetch("/api/milestones/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: active.id,
          newIndex,
        }),
      });
    } catch (error) {
      console.error("Failed to update milestone order:", error);
      // Revert on error
      setMilestones(milestones);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track sprints and releases with milestones
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No milestones yet</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="outline"
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Milestone
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={milestones.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 md:grid-cols-2">
              {milestones.map((milestone) => (
                <SortableMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={setEditingMilestone}
                  onDelete={setDeletingMilestone}
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
