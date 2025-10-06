"use client";

import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { checkSLAStatus, formatBusinessHours } from "@/lib/business-hours";

interface SLAIndicatorProps {
  issue: {
    type: string;
    priority: string;
    reportedAt?: Date | null;
    createdAt: Date;
    resolvedAt?: Date | null;
    status: {
      type: string;
    };
  };
  slaConfig?: {
    resolutionTimeHours: number;
  } | null;
  compact?: boolean;
}

export function SLAIndicator({ issue, slaConfig, compact = false }: SLAIndicatorProps) {
  // Only show SLA for maintenance issues
  if (issue.type !== "MAINTENANCE" && issue.type !== "BUG") {
    return null;
  }

  // If already resolved, show resolution time
  if (issue.resolvedAt) {
    const startDate = issue.reportedAt || issue.createdAt;
    const resolutionTime = formatBusinessHours(new Date(startDate), new Date(issue.resolvedAt));

    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="h-3 w-3" />
        {compact ? resolutionTime : `Resolved in ${resolutionTime}`}
      </div>
    );
  }

  // If no SLA configured, don't show indicator
  if (!slaConfig) {
    return null;
  }

  // Check current SLA status
  const startDate = issue.reportedAt || issue.createdAt;
  const slaStatus = checkSLAStatus(
    new Date(startDate),
    slaConfig.resolutionTimeHours
  );

  // Don't show if status is DONE or CANCELED
  if (issue.status.type === "DONE" || issue.status.type === "CANCELED") {
    return null;
  }

  const remainingTime = formatBusinessHours(
    new Date(),
    new Date(new Date().getTime() + slaStatus.remainingMinutes * 60 * 1000)
  );

  if (slaStatus.status === "overdue") {
    const overdueTime = formatBusinessHours(
      new Date(new Date().getTime() + slaStatus.remainingMinutes * 60 * 1000),
      new Date()
    );

    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <AlertTriangle className="h-3 w-3" />
        {compact ? `${overdueTime} overdue` : `SLA overdue by ${overdueTime}`}
      </div>
    );
  }

  if (slaStatus.status === "at-risk") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <Clock className="h-3 w-3" />
        {compact ? `${remainingTime} left` : `${remainingTime} remaining`}
      </div>
    );
  }

  // on-time
  if (!compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="h-3 w-3" />
        {remainingTime} remaining
      </div>
    );
  }

  return null; // Don't show on-time indicator in compact mode
}
