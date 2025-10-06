"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TimeEntry {
  id: string;
  issueId: string;
  startTime: string;
  duration: number;
  issue: {
    id: string;
    identifier: string;
    title: string;
    project?: {
      name: string;
    };
    status: {
      name: string;
    };
    milestone?: {
      name: string;
    };
  };
}

interface TimeEntryWithElapsed extends TimeEntry {
  elapsedTime: number;
}

interface TimeTrackerContextType {
  activeEntries: TimeEntryWithElapsed[];
  isRunning: boolean;
  startTimer: (issueId: string, description?: string) => Promise<void>;
  stopTimer: (entryId: string) => Promise<void>;
  fetchActiveEntries: () => Promise<void>;
  getElapsedTime: (entryId: string) => number;
  isIssueTracking: (issueId: string) => boolean;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeEntries, setActiveEntries] = useState<TimeEntryWithElapsed[]>([]);

  const fetchActiveEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/time-entries");
      if (response.ok) {
        const data: TimeEntry[] = await response.json();
        if (data && Array.isArray(data)) {
          const now = Date.now();
          const entriesWithElapsed = data.map((entry) => {
            const start = new Date(entry.startTime).getTime();
            const elapsed = Math.floor((now - start) / 1000) + entry.duration;
            return { ...entry, elapsedTime: elapsed };
          });
          setActiveEntries(entriesWithElapsed);
        } else {
          setActiveEntries([]);
        }
      }
    } catch (error) {
      console.error("Error fetching active time entries:", error);
    }
  }, []);

  // Fetch active entries on mount
  useEffect(() => {
    fetchActiveEntries();
  }, [fetchActiveEntries]);

  // Update elapsed time every second for all active entries
  useEffect(() => {
    if (activeEntries.length === 0) return;

    const interval = setInterval(() => {
      setActiveEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          elapsedTime: entry.elapsedTime + 1,
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntries.length]);

  const startTimer = async (issueId: string, description?: string) => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start timer");
      }

      await fetchActiveEntries();
      router.refresh();
    } catch (error) {
      console.error("Error starting timer:", error);
      throw error;
    }
  };

  const stopTimer = async (entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to stop timer");
      }

      await fetchActiveEntries();
      router.refresh();
    } catch (error) {
      console.error("Error stopping timer:", error);
      throw error;
    }
  };

  const getElapsedTime = (entryId: string): number => {
    const entry = activeEntries.find((e) => e.id === entryId);
    return entry?.elapsedTime || 0;
  };

  const isIssueTracking = (issueId: string): boolean => {
    return activeEntries.some((e) => e.issueId === issueId);
  };

  return (
    <TimeTrackerContext.Provider
      value={{
        activeEntries,
        isRunning: activeEntries.length > 0,
        startTimer,
        stopTimer,
        fetchActiveEntries,
        getElapsedTime,
        isIssueTracking,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error("useTimeTracker must be used within a TimeTrackerProvider");
  }
  return context;
}
