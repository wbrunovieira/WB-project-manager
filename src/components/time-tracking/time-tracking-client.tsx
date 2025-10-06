"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Tag, FolderKanban, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeTrackingClientProps {
  projects: any[];
  milestones: any[];
  labels: any[];
}

interface TimeEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  calculatedDuration: number;
  description: string | null;
  issue: {
    id: string;
    identifier: string;
    title: string;
    project: {
      id: string;
      name: string;
    };
    status: {
      name: string;
      type: string;
    };
    milestone?: {
      id: string;
      name: string;
    };
    labels: Array<{
      label: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  };
}

interface GroupedByIssue {
  issue: TimeEntry["issue"];
  totalSeconds: number;
  entries: TimeEntry[];
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ProjectStats {
  projectId: string;
  projectName: string;
  totalSeconds: number;
  doneSeconds: number;
  inProgressSeconds: number;
  milestones: Map<string, MilestoneStats>;
  labels: Map<string, LabelStats>;
  issues: GroupedByIssue[];
}

interface MilestoneStats {
  milestoneId: string;
  milestoneName: string;
  totalSeconds: number;
  doneSeconds: number;
  inProgressSeconds: number;
  issues: GroupedByIssue[];
}

interface LabelStats {
  labelId: string;
  labelName: string;
  labelColor: string;
  totalSeconds: number;
  doneSeconds: number;
  inProgressSeconds: number;
  issues: GroupedByIssue[];
}

interface PeriodStats {
  totalSeconds: number;
  doneSeconds: number;
  inProgressSeconds: number;
  projectBreakdown: Map<string, { name: string; seconds: number }>;
  milestoneBreakdown: Map<string, { name: string; seconds: number }>;
  labelBreakdown: Map<string, { name: string; color: string; seconds: number }>;
}

interface PeriodComparison {
  current: number;
  previous: number;
  percentChange: number;
}

export function TimeTrackingClient({
  projects,
  milestones,
  labels,
}: TimeTrackingClientProps) {
  const [viewMode, setViewMode] = useState<"project" | "milestone" | "label">("project");
  const [timeData, setTimeData] = useState<{
    totalSeconds: number;
    entries: TimeEntry[];
    groupedByIssue: GroupedByIssue[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTimeData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/time-tracking");
        if (response.ok) {
          const data = await response.json();
          setTimeData(data);
        }
      } catch (error) {
        console.error("Error fetching time tracking data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeData();
  }, []);

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const calculateProjectStats = (): ProjectStats[] => {
    if (!timeData) return [];

    const projectsMap = new Map<string, ProjectStats>();

    for (const group of timeData.groupedByIssue) {
      const projectId = group.issue.project.id;
      const projectName = group.issue.project.name;
      const isDone = group.issue.status.type === "DONE";
      const isInProgress = group.issue.status.type === "IN_PROGRESS";

      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          projectId,
          projectName,
          totalSeconds: 0,
          doneSeconds: 0,
          inProgressSeconds: 0,
          milestones: new Map(),
          labels: new Map(),
          issues: [],
        });
      }

      const project = projectsMap.get(projectId)!;
      project.totalSeconds += group.totalSeconds;
      if (isDone) project.doneSeconds += group.totalSeconds;
      if (isInProgress) project.inProgressSeconds += group.totalSeconds;
      project.issues.push(group);

      // Group by milestone
      const milestoneId = group.issue.milestone?.id || "no-milestone";
      const milestoneName = group.issue.milestone?.name || "No Milestone";

      if (!project.milestones.has(milestoneId)) {
        project.milestones.set(milestoneId, {
          milestoneId,
          milestoneName,
          totalSeconds: 0,
          doneSeconds: 0,
          inProgressSeconds: 0,
          issues: [],
        });
      }

      const milestone = project.milestones.get(milestoneId)!;
      milestone.totalSeconds += group.totalSeconds;
      if (isDone) milestone.doneSeconds += group.totalSeconds;
      if (isInProgress) milestone.inProgressSeconds += group.totalSeconds;
      milestone.issues.push(group);

      // Group by labels
      if (group.issue.labels.length === 0) {
        const labelId = "no-label";
        if (!project.labels.has(labelId)) {
          project.labels.set(labelId, {
            labelId,
            labelName: "No Label",
            labelColor: "#gray",
            totalSeconds: 0,
            doneSeconds: 0,
            inProgressSeconds: 0,
            issues: [],
          });
        }
        const label = project.labels.get(labelId)!;
        label.totalSeconds += group.totalSeconds;
        if (isDone) label.doneSeconds += group.totalSeconds;
        if (isInProgress) label.inProgressSeconds += group.totalSeconds;
        label.issues.push(group);
      } else {
        for (const issueLabel of group.issue.labels) {
          const labelId = issueLabel.label.id;
          if (!project.labels.has(labelId)) {
            project.labels.set(labelId, {
              labelId,
              labelName: issueLabel.label.name,
              labelColor: issueLabel.label.color,
              totalSeconds: 0,
              doneSeconds: 0,
              inProgressSeconds: 0,
              issues: [],
            });
          }
          const label = project.labels.get(labelId)!;
          label.totalSeconds += group.totalSeconds;
          if (isDone) label.doneSeconds += group.totalSeconds;
          if (isInProgress) label.inProgressSeconds += group.totalSeconds;
          if (!label.issues.find(i => i.issue.id === group.issue.id)) {
            label.issues.push(group);
          }
        }
      }
    }

    return Array.from(projectsMap.values()).sort((a, b) =>
      b.totalSeconds - a.totalSeconds
    );
  };

  const projectStats = calculateProjectStats();

  const calculatePeriodStats = (startDate: Date, endDate: Date): PeriodStats => {
    if (!timeData) {
      return {
        totalSeconds: 0,
        doneSeconds: 0,
        inProgressSeconds: 0,
        projectBreakdown: new Map(),
        milestoneBreakdown: new Map(),
        labelBreakdown: new Map(),
      };
    }

    const stats: PeriodStats = {
      totalSeconds: 0,
      doneSeconds: 0,
      inProgressSeconds: 0,
      projectBreakdown: new Map(),
      milestoneBreakdown: new Map(),
      labelBreakdown: new Map(),
    };

    for (const group of timeData.groupedByIssue) {
      for (const entry of group.entries) {
        const entryStart = new Date(entry.startTime);
        const entryEnd = entry.endTime ? new Date(entry.endTime) : new Date();

        // Check if entry overlaps with period
        if (entryEnd >= startDate && entryStart <= endDate) {
          // Calculate overlapping time
          const overlapStart = entryStart > startDate ? entryStart : startDate;
          const overlapEnd = entryEnd < endDate ? entryEnd : endDate;
          const overlapSeconds = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 1000);

          if (overlapSeconds > 0) {
            stats.totalSeconds += overlapSeconds;

            const isDone = group.issue.status.type === "DONE";
            const isInProgress = group.issue.status.type === "IN_PROGRESS";

            if (isDone) stats.doneSeconds += overlapSeconds;
            if (isInProgress) stats.inProgressSeconds += overlapSeconds;

            // Project breakdown
            const projectId = group.issue.project.id;
            if (!stats.projectBreakdown.has(projectId)) {
              stats.projectBreakdown.set(projectId, {
                name: group.issue.project.name,
                seconds: 0,
              });
            }
            stats.projectBreakdown.get(projectId)!.seconds += overlapSeconds;

            // Milestone breakdown
            if (group.issue.milestone) {
              const milestoneId = group.issue.milestone.id;
              if (!stats.milestoneBreakdown.has(milestoneId)) {
                stats.milestoneBreakdown.set(milestoneId, {
                  name: group.issue.milestone.name,
                  seconds: 0,
                });
              }
              stats.milestoneBreakdown.get(milestoneId)!.seconds += overlapSeconds;
            }

            // Label breakdown
            for (const issueLabel of group.issue.labels) {
              const labelId = issueLabel.label.id;
              if (!stats.labelBreakdown.has(labelId)) {
                stats.labelBreakdown.set(labelId, {
                  name: issueLabel.label.name,
                  color: issueLabel.label.color,
                  seconds: 0,
                });
              }
              stats.labelBreakdown.get(labelId)!.seconds += overlapSeconds;
            }
          }
        }
      }
    }

    return stats;
  };

  const getDateRanges = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    return {
      today: { start: startOfToday, end: now },
      yesterday: { start: startOfYesterday, end: startOfToday },
      thisWeek: { start: startOfWeek, end: now },
      lastWeek: { start: startOfLastWeek, end: startOfWeek },
      thisMonth: { start: startOfMonth, end: now },
      lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
    };
  };

  const dateRanges = getDateRanges();

  const todayStats = calculatePeriodStats(dateRanges.today.start, dateRanges.today.end);
  const yesterdayStats = calculatePeriodStats(dateRanges.yesterday.start, dateRanges.yesterday.end);
  const thisWeekStats = calculatePeriodStats(dateRanges.thisWeek.start, dateRanges.thisWeek.end);
  const lastWeekStats = calculatePeriodStats(dateRanges.lastWeek.start, dateRanges.lastWeek.end);
  const thisMonthStats = calculatePeriodStats(dateRanges.thisMonth.start, dateRanges.thisMonth.end);
  const lastMonthStats = calculatePeriodStats(dateRanges.lastMonth.start, dateRanges.lastMonth.end);

  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const todayComparison = {
    current: todayStats.totalSeconds,
    previous: yesterdayStats.totalSeconds,
    percentChange: calculatePercentChange(todayStats.totalSeconds, yesterdayStats.totalSeconds),
  };

  const weekComparison = {
    current: thisWeekStats.totalSeconds,
    previous: lastWeekStats.totalSeconds,
    percentChange: calculatePercentChange(thisWeekStats.totalSeconds, lastWeekStats.totalSeconds),
  };

  const monthComparison = {
    current: thisMonthStats.totalSeconds,
    previous: lastMonthStats.totalSeconds,
    percentChange: calculatePercentChange(thisMonthStats.totalSeconds, lastMonthStats.totalSeconds),
  };

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("project")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "project"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                By Project
              </div>
            </button>
            <button
              onClick={() => setViewMode("milestone")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "milestone"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                By Milestone
              </div>
            </button>
            <button
              onClick={() => setViewMode("label")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "label"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                By Label
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Period Analysis */}
      {!isLoading && timeData && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Time Analysis by Period</h2>

          <div className="grid grid-cols-3 gap-4">
            {/* Today */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">Today</div>
                    <div className="flex items-center gap-1">
                      {todayComparison.percentChange > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">
                            +{todayComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : todayComparison.percentChange < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">
                            {todayComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-400">0%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(todayStats.totalSeconds)}
                  </div>
                  <div className="text-xs text-gray-500">vs yesterday: {formatTime(yesterdayStats.totalSeconds)}</div>

                  {/* Breakdown */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="text-xs font-semibold text-gray-700 uppercase">Top Projects</div>
                    {Array.from(todayStats.projectBreakdown.entries())
                      .sort((a, b) => b[1].seconds - a[1].seconds)
                      .slice(0, 3)
                      .map(([id, data]) => (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{data.name}</span>
                          <span className="font-medium text-gray-900">{formatTime(data.seconds)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Week */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">This Week</div>
                    <div className="flex items-center gap-1">
                      {weekComparison.percentChange > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">
                            +{weekComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : weekComparison.percentChange < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">
                            {weekComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-400">0%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(thisWeekStats.totalSeconds)}
                  </div>
                  <div className="text-xs text-gray-500">vs last week: {formatTime(lastWeekStats.totalSeconds)}</div>

                  {/* Breakdown */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="text-xs font-semibold text-gray-700 uppercase">Top Milestones</div>
                    {Array.from(thisWeekStats.milestoneBreakdown.entries())
                      .sort((a, b) => b[1].seconds - a[1].seconds)
                      .slice(0, 3)
                      .map(([id, data]) => (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{data.name}</span>
                          <span className="font-medium text-gray-900">{formatTime(data.seconds)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600">This Month</div>
                    <div className="flex items-center gap-1">
                      {monthComparison.percentChange > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">
                            +{monthComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : monthComparison.percentChange < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-600">
                            {monthComparison.percentChange.toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-400">0%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatTime(thisMonthStats.totalSeconds)}
                  </div>
                  <div className="text-xs text-gray-500">vs last month: {formatTime(lastMonthStats.totalSeconds)}</div>

                  {/* Breakdown */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="text-xs font-semibold text-gray-700 uppercase">Top Labels</div>
                    {Array.from(thisMonthStats.labelBreakdown.entries())
                      .sort((a, b) => b[1].seconds - a[1].seconds)
                      .slice(0, 3)
                      .map(([id, data]) => (
                        <div key={id} className="flex items-center justify-between text-xs">
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium truncate"
                            style={{
                              backgroundColor: `${data.color}15`,
                              color: data.color,
                            }}
                          >
                            {data.name}
                          </span>
                          <span className="font-medium text-gray-900">{formatTime(data.seconds)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown by Period */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Today Status</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">✓ Completed</span>
                      <span className="font-semibold">{formatTime(todayStats.doneSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">→ In Progress</span>
                      <span className="font-semibold">{formatTime(todayStats.inProgressSeconds)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Week Status</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">✓ Completed</span>
                      <span className="font-semibold">{formatTime(thisWeekStats.doneSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">→ In Progress</span>
                      <span className="font-semibold">{formatTime(thisWeekStats.inProgressSeconds)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Month Status</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">✓ Completed</span>
                      <span className="font-semibold">{formatTime(thisMonthStats.doneSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">→ In Progress</span>
                      <span className="font-semibold">{formatTime(thisMonthStats.inProgressSeconds)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && timeData && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Total Time</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatTime(timeData.totalSeconds)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-600">
                {formatTime(
                  timeData.groupedByIssue
                    .filter((g) => g.issue.status.type === "DONE")
                    .reduce((sum, g) => sum + g.totalSeconds, 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-1">In Progress</div>
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(
                  timeData.groupedByIssue
                    .filter((g) => g.issue.status.type === "IN_PROGRESS")
                    .reduce((sum, g) => sum + g.totalSeconds, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project View */}
      {!isLoading && viewMode === "project" && projectStats.length > 0 && (
        <div className="space-y-4">
          {projectStats.map((project) => (
            <Card key={project.projectId}>
              <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleSection(project.projectId)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.has(project.projectId) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <CardTitle className="text-xl">{project.projectName}</CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{project.issues.length} issues</span>
                        <span className="text-green-600">✓ {formatTime(project.doneSeconds)}</span>
                        <span className="text-blue-600">→ {formatTime(project.inProgressSeconds)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(project.totalSeconds)}
                  </div>
                </div>
              </CardHeader>

              {expandedSections.has(project.projectId) && (
                <CardContent>
                  {/* Milestones */}
                  <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      By Milestone
                    </h3>
                    {Array.from(project.milestones.values()).map((milestone) => (
                      <div
                        key={milestone.milestoneId}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{milestone.milestoneName}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>{milestone.issues.length} issues</span>
                            <span className="text-green-600">✓ {formatTime(milestone.doneSeconds)}</span>
                            <span className="text-blue-600">→ {formatTime(milestone.inProgressSeconds)}</span>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatTime(milestone.totalSeconds)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Labels */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      By Label
                    </h3>
                    {Array.from(project.labels.values()).map((label) => (
                      <div
                        key={label.labelId}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: label.labelColor !== "#gray" ? `${label.labelColor}15` : "#f3f4f6",
                                color: label.labelColor !== "#gray" ? label.labelColor : "#6b7280",
                                border: label.labelColor !== "#gray" ? `1px solid ${label.labelColor}40` : "1px solid #e5e7eb",
                              }}
                            >
                              {label.labelName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>{label.issues.length} issues</span>
                            <span className="text-green-600">✓ {formatTime(label.doneSeconds)}</span>
                            <span className="text-blue-600">→ {formatTime(label.inProgressSeconds)}</span>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatTime(label.totalSeconds)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Milestone View */}
      {!isLoading && viewMode === "milestone" && projectStats.length > 0 && (
        <div className="space-y-4">
          {projectStats.map((project) =>
            Array.from(project.milestones.values()).map((milestone) => (
              <Card key={`${project.projectId}-${milestone.milestoneId}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{milestone.milestoneName}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="text-gray-500">{project.projectName}</span>
                        <span>{milestone.issues.length} issues</span>
                        <span className="text-green-600">✓ {formatTime(milestone.doneSeconds)}</span>
                        <span className="text-blue-600">→ {formatTime(milestone.inProgressSeconds)}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(milestone.totalSeconds)}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Label View */}
      {!isLoading && viewMode === "label" && projectStats.length > 0 && (
        <div className="space-y-4">
          {(() => {
            const allLabels = new Map<string, { label: LabelStats; projects: string[] }>();
            projectStats.forEach((project) => {
              Array.from(project.labels.values()).forEach((label) => {
                if (!allLabels.has(label.labelId)) {
                  allLabels.set(label.labelId, {
                    label: { ...label, totalSeconds: 0, doneSeconds: 0, inProgressSeconds: 0, issues: [] },
                    projects: [],
                  });
                }
                const entry = allLabels.get(label.labelId)!;
                entry.label.totalSeconds += label.totalSeconds;
                entry.label.doneSeconds += label.doneSeconds;
                entry.label.inProgressSeconds += label.inProgressSeconds;
                entry.projects.push(project.projectName);
              });
            });

            return Array.from(allLabels.values())
              .sort((a, b) => b.label.totalSeconds - a.label.totalSeconds)
              .map(({ label, projects }) => (
                <Card key={label.labelId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                            style={{
                              backgroundColor: label.labelColor !== "#gray" ? `${label.labelColor}15` : "#f3f4f6",
                              color: label.labelColor !== "#gray" ? label.labelColor : "#6b7280",
                              border: label.labelColor !== "#gray" ? `1px solid ${label.labelColor}40` : "1px solid #e5e7eb",
                            }}
                          >
                            {label.labelName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{[...new Set(projects)].length} projects</span>
                          <span className="text-green-600">✓ {formatTime(label.doneSeconds)}</span>
                          <span className="text-blue-600">→ {formatTime(label.inProgressSeconds)}</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(label.totalSeconds)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ));
          })()}
        </div>
      )}

      {!isLoading && (!timeData || timeData.groupedByIssue.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center">No time entries found</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading...</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
