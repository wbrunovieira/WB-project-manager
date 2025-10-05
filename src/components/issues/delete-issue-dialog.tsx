"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DeleteIssueDialogProps {
  issueId: string;
  issueTitle: string;
  issueKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteIssueDialog({
  issueId,
  issueTitle,
  issueKey,
  open,
  onOpenChange,
}: DeleteIssueDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete issue");
      }

      toast({
        title: "Issue deleted",
        description: `${issueKey}: ${issueTitle} has been deleted successfully.`,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete issue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Issue</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this issue? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{issueKey}:</span> {issueTitle}
          </p>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
