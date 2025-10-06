"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelSelector } from "@/components/ui/label-selector";
import { useToast } from "@/hooks/use-toast";

interface LabelType {
  id: string;
  name: string;
  color: string;
}

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  statusId: z.string().min(1, "Status is required"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
});

type CreateIssueForm = z.infer<typeof createIssueSchema>;

interface CreateIssueModalProps {
  statuses: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects?: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  workspaceId: string;
  onIssueCreated?: (issue: any) => void;
}

export function CreateIssueModal({
  statuses,
  users,
  projects = [],
  milestones = [],
  open,
  onOpenChange,
  defaultProjectId,
  workspaceId,
  onIssueCreated,
}: CreateIssueModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<LabelType[]>([]);
  const [createAnother, setCreateAnother] = useState(false);

  // Find Bruno Vieira's user ID
  const brunoUser = users.find(
    (user) => user.name === "Bruno Vieira" || user.email?.includes("bruno")
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<CreateIssueForm>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      statusId: statuses[0]?.id || "",
      priority: "NO_PRIORITY",
      projectId: defaultProjectId,
      assigneeId: brunoUser?.id || "",
    },
  });

  useEffect(() => {
    if (open && workspaceId) {
      fetchLabels(workspaceId);
    }
  }, [open, workspaceId]);

  useEffect(() => {
    if (open && !createAnother) {
      // Reset form with Bruno Vieira as default assignee when opening modal
      reset({
        title: "",
        description: "",
        statusId: statuses[0]?.id || "",
        priority: "NO_PRIORITY",
        projectId: defaultProjectId,
        assigneeId: brunoUser?.id || "",
        milestoneId: "",
      });
      setSelectedLabelIds([]);
    }
  }, [open, createAnother, brunoUser, statuses, defaultProjectId, reset]);

  const fetchLabels = async (wsId: string) => {
    try {
      const response = await fetch(`/api/labels?workspaceId=${wsId}`);
      if (response.ok) {
        const labels = await response.json();
        setAvailableLabels(labels);
      }
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    const response = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, workspaceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create label");
    }

    const newLabel = await response.json();
    setAvailableLabels([...availableLabels, newLabel]);
    return newLabel;
  };

  const onSubmit = async (data: CreateIssueForm) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          workspaceId,
          assigneeId: data.assigneeId || undefined,
          projectId: data.projectId || undefined,
          milestoneId: data.milestoneId || undefined,
          labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create issue");
      }

      const issue = await response.json();

      toast({
        title: "Issue created",
        description: `Issue #${issue.identifier}: ${issue.title}`,
      });

      // Notify parent component about the new issue
      if (onIssueCreated) {
        onIssueCreated(issue);
      }

      // Always refresh to show the new issue
      router.refresh();

      if (createAnother) {
        // Save current values
        const currentValues = getValues();

        // Reset only title and description
        reset({
          title: "",
          description: "",
          statusId: currentValues.statusId,
          priority: currentValues.priority,
          assigneeId: currentValues.assigneeId,
          projectId: currentValues.projectId,
          milestoneId: currentValues.milestoneId,
        });
        // Keep labels selected
        // Modal stays open
      } else {
        reset();
        setSelectedLabelIds([]);
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create issue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
          <DialogDescription>
            Add a new issue to track work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Fix login bug"
              {...register("title")}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Content</Label>
            <textarea
              id="description"
              placeholder="Describe the issue in detail..."
              {...register("description")}
              className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusId">Status</Label>
            <select
              id="statusId"
              {...register("statusId")}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            {errors.statusId && (
              <p className="text-sm text-red-600">{errors.statusId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NO_PRIORITY">No Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee (optional)</Label>
              <select
                id="assigneeId"
                {...register("assigneeId")}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Project (optional)</Label>
                <select
                  id="projectId"
                  {...register("projectId")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {milestones.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="milestoneId">Milestone (optional)</Label>
                <select
                  id="milestoneId"
                  {...register("milestoneId")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No milestone</option>
                  {milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Labels (optional)</Label>
            <LabelSelector
              availableLabels={availableLabels}
              selectedLabelIds={selectedLabelIds}
              onLabelsChange={setSelectedLabelIds}
              onCreateLabel={handleCreateLabel}
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="createAnother"
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="createAnother"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Create another
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Issue"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
