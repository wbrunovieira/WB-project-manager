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

interface TimeTrackerContextType {
  activeEntry: TimeEntry | null;
  elapsedTime: number;
  isRunning: boolean;
  startTimer: (issueId: string, description?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  fetchActiveEntry: () => Promise<void>;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const fetchActiveEntry = useCallback(async () => {
    try {
      const response = await fetch("/api/time-entries");
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setActiveEntry(data);
          setIsRunning(true);
          // Calculate initial elapsed time
          const start = new Date(data.startTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000) + data.duration;
          setElapsedTime(elapsed);
        } else {
          setActiveEntry(null);
          setIsRunning(false);
          setElapsedTime(0);
        }
      }
    } catch (error) {
      console.error("Error fetching active time entry:", error);
    }
  }, []);

  // Fetch active entry on mount
  useEffect(() => {
    fetchActiveEntry();
  }, [fetchActiveEntry]);

  // Update elapsed time every second
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

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

      const data = await response.json();
      setActiveEntry(data);
      setIsRunning(true);
      setElapsedTime(0);
      router.refresh();
    } catch (error) {
      console.error("Error starting timer:", error);
      throw error;
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const response = await fetch(`/api/time-entries/${activeEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to stop timer");
      }

      setActiveEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      router.refresh();
    } catch (error) {
      console.error("Error stopping timer:", error);
      throw error;
    }
  };

  return (
    <TimeTrackerContext.Provider
      value={{
        activeEntry,
        elapsedTime,
        isRunning,
        startTimer,
        stopTimer,
        fetchActiveEntry,
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
