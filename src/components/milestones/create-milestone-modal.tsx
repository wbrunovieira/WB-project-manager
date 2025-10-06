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

const createMilestoneSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

type CreateMilestoneForm = z.infer<typeof createMilestoneSchema>;

interface CreateMilestoneModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneCreated?: (milestone: any) => void;
}

export function CreateMilestoneModal({
  projectId,
  open,
  onOpenChange,
  onMilestoneCreated,
}: CreateMilestoneModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateMilestoneForm>({
    resolver: zodResolver(createMilestoneSchema),
  });

  const onSubmit = async (data: CreateMilestoneForm) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create milestone");
      }

      const milestone = await response.json();

      toast({
        title: "Milestone created",
        description: `${milestone.name} has been created successfully.`,
      });

      // Call callback to update UI immediately
      if (onMilestoneCreated) {
        onMilestoneCreated(milestone);
      }

      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create milestone",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Milestone</DialogTitle>
          <DialogDescription>
            Create a milestone to track sprint or release progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Milestone name</Label>
            <Input
              id="name"
              placeholder="Sprint 1"
              {...register("name")}
              className="bg-[#792990]/10 border-[#792990]/30 text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:ring-[#FFB947]"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (optional)</Label>
            <textarea
              id="description"
              placeholder="Focus on core features and bug fixes"
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-[#792990]/30 bg-[#792990]/10 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:outline-none focus:ring-2 focus:ring-[#FFB947]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-300">Start date (optional)</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="bg-[#792990]/10 border-[#792990]/30 text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:ring-[#FFB947]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-gray-300">Target date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                {...register("targetDate")}
                className="bg-[#792990]/10 border-[#792990]/30 text-gray-100 placeholder:text-gray-400 focus:border-[#FFB947] focus:ring-[#FFB947]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="bg-[#792990]/10 hover:bg-[#792990]/20 text-gray-300 border-[#792990]/30"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#FFB947] hover:bg-[#FFB947]/90 text-gray-900">
              {isLoading ? "Creating..." : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
