"use client";

import { useTimeTracker } from "@/contexts/time-tracker-context";
import { Clock, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FloatingTimer() {
  const { activeEntry, elapsedTime, isRunning, stopTimer } = useTimeTracker();

  if (!isRunning || !activeEntry) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            #{activeEntry.issue.identifier} {activeEntry.issue.title}
          </p>
          <p className="text-xs text-gray-500">
            {activeEntry.issue.project?.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-md bg-gray-100 px-3 py-1.5">
          <p className="font-mono text-lg font-semibold text-gray-900">
            {formatTime(elapsedTime)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => stopTimer()}
          className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </Button>
      </div>
    </div>
  );
}
