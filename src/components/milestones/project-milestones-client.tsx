"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, CalendarDays, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateDisplay } from "@/components/ui/date-display";
import { CreateMilestoneModal } from "./create-milestone-modal";
import { EditMilestoneModal } from "./edit-milestone-modal";
import { DeleteMilestoneDialog } from "./delete-milestone-dialog";

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

export function ProjectMilestonesClient({
  projectId,
  milestones,
}: ProjectMilestonesClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);

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
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((milestone) => {
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
                key={milestone.id}
                className="group relative rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-16">
                      <h3 className="font-semibold text-gray-900">
                        {milestone.name}
                      </h3>
                      {milestone.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {milestone.description}
                        </p>
                      )}
                    </div>

                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMilestone(milestone)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingMilestone(milestone)}
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
          })}
        </div>
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
