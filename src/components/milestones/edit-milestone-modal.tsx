"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const editMilestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type EditMilestoneForm = z.infer<typeof editMilestoneSchema>;

interface EditMilestoneModalProps {
  milestone: {
    id: string;
    name: string;
    description?: string | null;
    startDate?: Date | null;
    targetDate?: Date | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMilestoneModal({
  milestone,
  open,
  onOpenChange,
}: EditMilestoneModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditMilestoneForm>({
    resolver: zodResolver(editMilestoneSchema),
    defaultValues: {
      name: milestone.name,
      description: milestone.description || "",
      startDate: milestone.startDate
        ? format(new Date(milestone.startDate), "yyyy-MM-dd")
        : "",
      targetDate: milestone.targetDate
        ? format(new Date(milestone.targetDate), "yyyy-MM-dd")
        : "",
    },
  });

  const onSubmit = async (data: EditMilestoneForm) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update milestone");
      }

      const updatedMilestone = await response.json();

      toast({
        title: "Milestone updated",
        description: `${updatedMilestone.name} has been updated successfully.`,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update milestone",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update milestone details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Milestone name</Label>
            <Input
              id="name"
              placeholder="Sprint 1"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              placeholder="Focus on core features and bug fixes"
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date (optional)</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                {...register("targetDate")}
              />
            </div>
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
              {isLoading ? "Updating..." : "Update Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
