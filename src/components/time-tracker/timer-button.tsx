"use client";

import { useTimeTracker } from "@/contexts/time-tracker-context";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TimerButtonProps {
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
  size?: "sm" | "default" | "icon";
}

export function TimerButton({
  issueId,
  issueIdentifier,
  issueTitle,
  size = "icon",
}: TimerButtonProps) {
  const { activeEntry, isRunning, startTimer, stopTimer } = useTimeTracker();
  const { toast } = useToast();

  const isThisIssueActive = activeEntry?.issueId === issueId;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (isThisIssueActive) {
        await stopTimer();
        toast({
          title: "Timer stopped",
          description: `Stopped tracking time for #${issueIdentifier}`,
        });
      } else {
        if (isRunning) {
          toast({
            title: "Timer already running",
            description: "Please stop the current timer first",
            variant: "destructive",
          });
          return;
        }

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

  return (
    <Button
      variant={isThisIssueActive ? "default" : "ghost"}
      size={size}
      onClick={handleClick}
      className={isThisIssueActive ? "bg-green-600 hover:bg-green-700" : ""}
      title={isThisIssueActive ? "Stop timer" : "Start timer"}
    >
      {isThisIssueActive ? (
        <Square className="h-4 w-4" fill="currentColor" />
      ) : (
        <Play className="h-4 w-4" fill="currentColor" />
      )}
    </Button>
  );
}
