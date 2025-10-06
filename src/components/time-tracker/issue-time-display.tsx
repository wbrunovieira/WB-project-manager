"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useTimeTracker } from "@/contexts/time-tracker-context";

interface IssueTimeDisplayProps {
  issueId: string;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

export function IssueTimeDisplay({ issueId }: IssueTimeDisplayProps) {
  const { lastUpdate } = useTimeTracker();
  const [timeData, setTimeData] = useState<{
    totalSeconds: number;
    activeEntries: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch(`/api/issues/${issueId}/time`);
        if (response.ok) {
          const data = await response.json();
          setTimeData(data);
        }
      } catch (error) {
        console.error("Error fetching issue time:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTime();

    // Refresh every 30 seconds if there are active entries
    const interval = setInterval(() => {
      if (timeData?.activeEntries && timeData.activeEntries > 0) {
        fetchTime();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [issueId, timeData?.activeEntries, lastUpdate]); // Re-fetch when lastUpdate changes

  if (isLoading || !timeData || timeData.totalSeconds === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-gray-600">
      <Clock className="h-3.5 w-3.5" />
      <span className="font-medium">{formatTime(timeData.totalSeconds)}</span>
      {timeData.activeEntries > 0 && (
        <span className="text-green-600 font-semibold">(active)</span>
      )}
    </div>
  );
}
