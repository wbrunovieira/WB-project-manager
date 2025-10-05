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

const editIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  statusId: z.string().min(1, "Status is required"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
});

type EditIssueForm = z.infer<typeof editIssueSchema>;

interface Issue {
  id: string;
  title: string;
  description?: string | null;
  statusId: string;
  priority: string;
  assigneeId?: string | null;
  projectId?: string | null;
  workspaceId: string;
  labels: Array<{ id: string }>;
}

interface EditIssueModalProps {
  issue: Issue;
  statuses: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects?: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIssueModal({
  issue,
  statuses,
  users,
  projects = [],
  open,
  onOpenChange,
}: EditIssueModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    issue.labels.map((label) => label.id)
  );
  const [availableLabels, setAvailableLabels] = useState<LabelType[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditIssueForm>({
    resolver: zodResolver(editIssueSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description || "",
      statusId: issue.statusId,
      priority: issue.priority as EditIssueForm["priority"],
      assigneeId: issue.assigneeId || "",
      projectId: issue.projectId || "",
    },
  });

  // Reset form when issue changes
  useEffect(() => {
    reset({
      title: issue.title,
      description: issue.description || "",
      statusId: issue.statusId,
      priority: issue.priority as EditIssueForm["priority"],
      assigneeId: issue.assigneeId || "",
      projectId: issue.projectId || "",
    });
    setSelectedLabelIds(issue.labels.map((label) => label.id));
  }, [issue, reset]);

  // Fetch available labels
  useEffect(() => {
    if (open && issue.workspaceId) {
      fetchLabels(issue.workspaceId);
    }
  }, [open, issue.workspaceId]);

  const fetchLabels = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/labels?workspaceId=${workspaceId}`);
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
      body: JSON.stringify({ name, color, workspaceId: issue.workspaceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create label");
    }

    const newLabel = await response.json();
    setAvailableLabels([...availableLabels, newLabel]);
    return newLabel;
  };

  const onSubmit = async (data: EditIssueForm) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assigneeId: data.assigneeId || null,
          projectId: data.projectId || null,
          labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update issue");
      }

      const updatedIssue = await response.json();

      toast({
        title: "Issue updated",
        description: `${updatedIssue.title} has been updated successfully.`,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update issue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Issue</DialogTitle>
          <DialogDescription>
            Update the issue details.
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
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              placeholder="Add more details..."
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
