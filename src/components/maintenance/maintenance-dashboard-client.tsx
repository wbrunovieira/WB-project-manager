"use client";

import { useState, useMemo } from "react";
import { Clock, CheckCircle, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { calculateBusinessHours } from "@/lib/business-hours";
import Link from "next/link";

interface Issue {
  id: string;
  identifier: string;
  title: string;
  type: string;
  priority: string;
  reportedAt?: Date | null;
  createdAt: Date;
  resolvedAt?: Date | null;
  resolutionTimeMinutes?: number | null;
  firstResponseAt?: Date | null;
  reopenCount: number;
  status: {
    type: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
    type: string;
  } | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface MaintenanceProject {
  id: string;
  name: string;
  _count: {
    issues: number;
  };
}

interface MaintenanceDashboardClientProps {
  issues: Issue[];
  maintenanceProjects: MaintenanceProject[];
}

export function MaintenanceDashboardClient({
  issues,
  maintenanceProjects,
}: MaintenanceDashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "all">("month");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  // Filter issues by period
  const filteredIssues = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (selectedPeriod) {
      case "week":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    return issues.filter((issue) => {
      const issueDate = issue.reportedAt || issue.createdAt;
      const isInPeriod = new Date(issueDate) >= cutoffDate;
      const isInProject = selectedProject === "all" || issue.project?.id === selectedProject;
      return isInPeriod && isInProject;
    });
  }, [issues, selectedPeriod, selectedProject]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const resolvedIssues = filteredIssues.filter((i) => i.resolvedAt);
    const openIssues = filteredIssues.filter((i) => !i.resolvedAt);
    const overdueIssues = filteredIssues.filter((i) => {
      if (i.resolvedAt) return false;
      // Simplified: consider overdue if open for more than 2 business days (18 hours)
      const startDate = i.reportedAt || i.createdAt;
      const elapsed = calculateBusinessHours(new Date(startDate), new Date());
      return elapsed > 18 * 60; // 18 hours in minutes
    });

    // Calculate average resolution time
    const resolutionTimes = resolvedIssues
      .map((i) => i.resolutionTimeMinutes)
      .filter((t): t is number => t !== null && t !== undefined);

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
        : 0;

    // Calculate average first response time
    const firstResponseTimes = filteredIssues
      .filter((i) => i.firstResponseAt)
      .map((i) => {
        const start = i.reportedAt || i.createdAt;
        return calculateBusinessHours(new Date(start), new Date(i.firstResponseAt!));
      });

    const avgFirstResponseTime =
      firstResponseTimes.length > 0
        ? firstResponseTimes.reduce((sum, t) => sum + t, 0) / firstResponseTimes.length
        : 0;

    // Calculate total reopens
    const totalReopens = filteredIssues.reduce((sum, i) => sum + i.reopenCount, 0);

    // Resolution rate
    const resolutionRate =
      filteredIssues.length > 0
        ? (resolvedIssues.length / filteredIssues.length) * 100
        : 0;

    return {
      total: filteredIssues.length,
      resolved: resolvedIssues.length,
      open: openIssues.length,
      overdue: overdueIssues.length,
      avgResolutionTime,
      avgFirstResponseTime,
      totalReopens,
      resolutionRate,
    };
  }, [filteredIssues]);

  // Format time for display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours >= 24) {
      const days = Math.floor(hours / 9); // 9 business hours per day
      const remainingHours = hours % 9;
      return `${days}d ${remainingHours}h`;
    }

    return `${hours}h ${mins}m`;
  };

  // Group issues by type
  const issuesByType = useMemo(() => {
    const grouped: Record<string, Issue[]> = {
      MAINTENANCE: [],
      BUG: [],
    };

    filteredIssues.forEach((issue) => {
      if (grouped[issue.type]) {
        grouped[issue.type].push(issue);
      }
    });

    return grouped;
  }, [filteredIssues]);

  // Group issues by priority
  const issuesByPriority = useMemo(() => {
    const grouped: Record<string, number> = {
      URGENT: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      NO_PRIORITY: 0,
    };

    filteredIssues.forEach((issue) => {
      grouped[issue.priority]++;
    });

    return grouped;
  }, [filteredIssues]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Maintenance Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Track and analyze maintenance issues and resolution times
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as "week" | "month" | "quarter" | "all")}
            className="rounded-md border border-[#792990]/40 bg-[#350459] px-3 py-2 text-sm text-gray-200 focus:border-[#792990] focus:outline-none focus:ring-2 focus:ring-[#792990]/50"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">Project:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-md border border-[#792990]/40 bg-[#350459] px-3 py-2 text-sm text-gray-200 focus:border-[#792990] focus:outline-none focus:ring-2 focus:ring-[#792990]/50"
          >
            <option value="all">All Projects</option>
            {maintenanceProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Issues */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Issues</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">{metrics.total}</p>
            </div>
            <div className="rounded-full bg-[#FFB947]/20 p-3">
              <BarChart3 className="h-6 w-6 text-[#FFB947]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-400">{metrics.resolved} resolved</span>
            <span className="text-gray-500">•</span>
            <span className="text-yellow-400">{metrics.open} open</span>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Resolution Time</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">
                {metrics.avgResolutionTime > 0 ? formatTime(metrics.avgResolutionTime) : "N/A"}
              </p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">Business hours only</p>
        </div>

        {/* Avg First Response Time */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg First Response</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">
                {metrics.avgFirstResponseTime > 0 ? formatTime(metrics.avgFirstResponseTime) : "N/A"}
              </p>
            </div>
            <div className="rounded-full bg-purple-500/20 p-3">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400">Time to IN_PROGRESS</p>
        </div>

        {/* Resolution Rate */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Resolution Rate</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">
                {metrics.resolutionRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-full bg-green-500/20 p-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {metrics.overdue > 0 && (
              <span className="text-red-400">{metrics.overdue} overdue</span>
            )}
            {metrics.totalReopens > 0 && (
              <>
                {metrics.overdue > 0 && <span className="text-gray-500">•</span>}
                <span className="text-orange-400">{metrics.totalReopens} reopened</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Issue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Type */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/5 to-transparent p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Issues by Type</h3>
          <div className="space-y-3">
            {Object.entries(issuesByType).map(([type, typeIssues]) => {
              const percentage = metrics.total > 0 ? (typeIssues.length / metrics.total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-300">{type}</span>
                    <span className="text-sm text-gray-400">{typeIssues.length}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#792990]/20">
                    <div
                      className={`h-full rounded-full ${
                        type === "BUG" ? "bg-red-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/5 to-transparent p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Issues by Priority</h3>
          <div className="space-y-3">
            {Object.entries(issuesByPriority)
              .filter(([, count]) => count > 0)
              .map(([priority, count]) => {
                const percentage = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">
                        {priority === "NO_PRIORITY" ? "No Priority" : priority}
                      </span>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#792990]/20">
                      <div
                        className={`h-full rounded-full ${
                          priority === "URGENT"
                            ? "bg-red-500"
                            : priority === "HIGH"
                            ? "bg-orange-500"
                            : priority === "MEDIUM"
                            ? "bg-yellow-500"
                            : priority === "LOW"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="rounded-lg border border-[#792990]/20 bg-gradient-to-br from-[#792990]/5 to-transparent p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Recent Issues</h3>
        <div className="space-y-2">
          {filteredIssues.slice(0, 10).map((issue) => {
            const isOverdue = !issue.resolvedAt && (() => {
              const startDate = issue.reportedAt || issue.createdAt;
              const elapsed = calculateBusinessHours(new Date(startDate), new Date());
              return elapsed > 18 * 60;
            })();

            return (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="flex items-center justify-between rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-4 transition-all hover:border-[#792990]/40 hover:from-[#792990]/10"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-mono text-gray-400">#{issue.identifier}</span>
                  <span className="text-sm font-medium text-gray-100 truncate">{issue.title}</span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      issue.type === "BUG"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {issue.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {issue.resolvedAt ? (
                    <span className="text-sm text-green-400">
                      Resolved in {formatTime(issue.resolutionTimeMinutes || 0)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">{issue.status.name}</span>
                  )}
                  {issue.assignee && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#792990] to-[#4a0672] text-xs font-semibold text-gray-200">
                      {issue.assignee.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          {filteredIssues.length === 0 && (
            <p className="text-center text-gray-400 py-8">No issues found for the selected period</p>
          )}
        </div>
      </div>
    </div>
  );
}
