"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Tag, FolderKanban, ChevronDown, ChevronRight } from "lucide-react";
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
