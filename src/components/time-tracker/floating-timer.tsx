"use client";

import { useTimeTracker } from "@/contexts/time-tracker-context";
import { Clock, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function FloatingTimer() {
  const { activeEntries, stopTimer } = useTimeTracker();
  const [isExpanded, setIsExpanded] = useState(true);

  if (activeEntries.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Active Timers ({activeEntries.length})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Timer List */}
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto">
            {activeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-gray-100 p-3 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    #{entry.issue.identifier} {entry.issue.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {entry.issue.project?.name || "No project"}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <div className="rounded-md bg-gray-100 px-2 py-1">
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {formatTime(entry.elapsedTime)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopTimer(entry.id);
                    }}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
