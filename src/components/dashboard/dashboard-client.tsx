"use client";

import { useState } from "react";
import { Circle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { TimerButton } from "@/components/time-tracker/timer-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  issues: any[];
  labels: any[];
}

type GroupBy = "project" | "status" | "label";

export function DashboardClient({ issues, labels }: DashboardClientProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("project");

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "CANCELED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const groupIssues = () => {
    const grouped: Record<string, any[]> = {};

    issues.forEach((issue) => {
      let key: string;
      let displayName: string;

      switch (groupBy) {
        case "project":
          key = issue.project.id;
          displayName = issue.project.name;
          break;
        case "status":
          key = issue.status.id;
          displayName = issue.status.name;
          break;
        case "label":
          if (issue.labels.length === 0) {
            key = "no-label";
            displayName = "No Label";
          } else {
            // Group by first label
            key = issue.labels[0].label.id;
            displayName = issue.labels[0].label.name;
          }
          break;
        default:
          key = issue.project.id;
          displayName = issue.project.name;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({ ...issue, groupDisplayName: displayName });
    });

    return grouped;
  };

  const groupedIssues = groupIssues();

  return (
    <>
      {/* Group By Selector */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Group by:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-48 justify-between">
              {groupBy === "project" ? "Project" : groupBy === "status" ? "Status" : "Label"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => setGroupBy("project")}>
              Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("status")}>
              Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupBy("label")}>
              Label
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grouped Issues */}
      <div className="space-y-8">
        {Object.entries(groupedIssues).map(([key, groupIssues]) => {
          const displayName = groupIssues[0]?.groupDisplayName || key;

          return (
            <div key={key}>
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {displayName} ({groupIssues.length})
              </h3>

              <div className="space-y-2">
                {groupIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:bg-gradient-to-r hover:from-gray-50 hover:to-white"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm font-mono text-gray-500">
                        #{issue.identifier}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </span>
                      {groupBy !== "project" && (
                        <span className="text-xs text-gray-500">
                          {issue.project.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Timer Button */}
                      <TimerButton
                        issueId={issue.id}
                        issueIdentifier={issue.identifier}
                        issueTitle={issue.title}
                        issueStatusType={issue.status.type}
                        size="icon"
                      />

                      {/* Status Badge */}
                      {groupBy !== "status" && (
                        <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium">
                          {getStatusIcon(issue.status.type)}
                          <span className="text-gray-700">{issue.status.name}</span>
                        </div>
                      )}

                      {/* Labels */}
                      {groupBy !== "label" &&
                        issue.labels.map((issueLabel: any) => (
                          <span
                            key={issueLabel.labelId}
                            className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium shadow-sm"
                            style={{
                              backgroundColor: `${issueLabel.label.color}15`,
                              color: issueLabel.label.color,
                              border: `1px solid ${issueLabel.label.color}40`,
                            }}
                          >
                            {issueLabel.label.name}
                          </span>
                        ))}

                      {/* Priority */}
                      {issue.priority !== "NO_PRIORITY" && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            issue.priority === "URGENT"
                              ? "bg-red-50 text-red-700"
                              : issue.priority === "HIGH"
                              ? "bg-orange-50 text-orange-700"
                              : issue.priority === "MEDIUM"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {issue.priority}
                        </span>
                      )}

                      {/* Assignee */}
                      {issue.assignee && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white shadow-sm">
                            {issue.assignee.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {issues.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No issues found</p>
          </div>
        )}
      </div>
    </>
  );
}
