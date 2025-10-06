"use client";

import { CalendarDays, CheckCircle2 } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";

interface ProjectDatesProps {
  startDate?: Date | null;
  targetDate?: Date | null;
}

export function ProjectDates({ startDate, targetDate }: ProjectDatesProps) {
  if (!startDate && !targetDate) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-6 text-sm text-gray-300">
      {startDate && (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#FFB947]" />
          <span>
            Start: <DateDisplay date={startDate} />
          </span>
        </div>
      )}
      {targetDate && (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#FFB947]" />
          <span>
            Target: <DateDisplay date={targetDate} />
          </span>
        </div>
      )}
    </div>
  );
}
