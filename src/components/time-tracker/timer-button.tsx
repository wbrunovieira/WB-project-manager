"use client";

import { useTimeTracker } from "@/contexts/time-tracker-context";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TimerButtonProps {
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
  issueStatusType: string;
  size?: "sm" | "default" | "icon";
}

export function TimerButton({
  issueId,
  issueIdentifier,
  issueTitle,
  issueStatusType,
  size = "icon",
}: TimerButtonProps) {
  const { activeEntries, startTimer, stopTimer, isIssueTracking } = useTimeTracker();
  const { toast } = useToast();

  const isThisIssueActive = isIssueTracking(issueId);
  const activeEntry = activeEntries.find((e) => e.issueId === issueId);
  const isInProgress = issueStatusType === "IN_PROGRESS";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If trying to start timer and issue is not in progress
    if (!isThisIssueActive && !isInProgress) {
      toast({
        title: "Cannot start timer",
        description: "Only issues with 'In Progress' status can be tracked",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isThisIssueActive && activeEntry) {
        await stopTimer(activeEntry.id);
        toast({
          title: "Timer stopped",
          description: `Stopped tracking time for #${issueIdentifier}`,
        });
      } else {
        await startTimer(issueId);
        toast({
          title: "Timer started",
          description: `Started tracking time for #${issueIdentifier} ${issueTitle}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle timer",
        variant: "destructive",
      });
    }
  };

  // Don't show button if issue is not in progress and not currently tracking
  if (!isInProgress && !isThisIssueActive) {
    return null;
  }

  return (
    <Button
      variant={isThisIssueActive ? "default" : "ghost"}
      size={size}
      onClick={handleClick}
      className={
        isThisIssueActive
          ? "bg-[#FFB947] hover:bg-[#FFB947]/90 text-[#350459] font-semibold"
          : "hover:bg-[#792990]/20 text-gray-300"
      }
      title={
        isThisIssueActive
          ? "Stop timer"
          : isInProgress
          ? "Start timer"
          : "Move to In Progress to track time"
      }
    >
      {isThisIssueActive ? (
        <Square className="h-4 w-4" fill="currentColor" />
      ) : (
        <Play className="h-4 w-4" fill="currentColor" />
      )}
    </Button>
  );
}
