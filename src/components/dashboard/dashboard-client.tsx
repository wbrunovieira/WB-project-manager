"use client";

import { useState } from "react";
import { Circle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { TimerButton } from "@/components/time-tracker/timer-button";
import { IssueTimeDisplay } from "@/components/time-tracker/issue-time-display";
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
    <div className="min-h-screen bg-[#350459]">
      <div className="p-8">
        {/* Group By Selector */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">Group by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-between bg-[#792990]/10 border-[#792990]/30 text-gray-200 hover:bg-[#792990]/20 hover:border-[#792990]/50"
              >
                {groupBy === "project" ? "Project" : groupBy === "status" ? "Status" : "Label"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-[#4a0672] border-[#792990]/50 text-gray-200">
              <DropdownMenuItem
                onClick={() => setGroupBy("project")}
                className="hover:bg-[#792990]/50 focus:bg-[#792990]/50 cursor-pointer"
              >
                Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setGroupBy("status")}
                className="hover:bg-[#792990]/50 focus:bg-[#792990]/50 cursor-pointer"
              >
                Status
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setGroupBy("label")}
                className="hover:bg-[#792990]/50 focus:bg-[#792990]/50 cursor-pointer"
              >
                Label
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Grouped Issues */}
        <div className="space-y-6">
          {Object.entries(groupedIssues).map(([key, groupIssues]) => {
            const displayName = groupIssues[0]?.groupDisplayName || key;

            return (
              <div key={key}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-[#792990] to-transparent"></div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    {displayName}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[#792990]/20 text-gray-400 text-xs font-medium">
                    {groupIssues.length}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-[#792990] to-transparent"></div>
                </div>

                <div className="space-y-2">
                  {groupIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="group flex items-center gap-4 rounded-lg border border-[#792990]/20 bg-gradient-to-r from-[#792990]/5 to-transparent p-4 transition-all hover:border-[#792990]/40 hover:bg-gradient-to-r hover:from-[#792990]/10 hover:to-[#792990]/5"
                    >
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-[#792990]/30 text-gray-300 text-xs font-medium font-mono">
                        #{issue.identifier}
                      </span>
                      <span className="text-sm font-medium text-gray-100 truncate">
                        {issue.title}
                      </span>
                      {groupBy !== "project" && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {issue.project.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Time Display */}
                      <IssueTimeDisplay issueId={issue.id} />

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
                        <div className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium bg-[#792990]/10 border border-[#792990]/20">
                          {getStatusIcon(issue.status.type)}
                          <span className="text-gray-300">{issue.status.name}</span>
                        </div>
                      )}

                      {/* Labels */}
                      {groupBy !== "label" &&
                        issue.labels.map((issueLabel: any) => (
                          <span
                            key={issueLabel.labelId}
                            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium border"
                            style={{
                              backgroundColor: `${issueLabel.label.color}15`,
                              color: issueLabel.label.color,
                              borderColor: `${issueLabel.label.color}40`,
                            }}
                          >
                            {issueLabel.label.name}
                          </span>
                        ))}

                      {/* Priority */}
                      {issue.priority !== "NO_PRIORITY" && (
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                            issue.priority === "URGENT"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : issue.priority === "HIGH"
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              : issue.priority === "MEDIUM"
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {issue.priority}
                        </span>
                      )}

                      {/* Assignee */}
                      {issue.assignee && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#792990] to-[#4a0672] text-xs font-semibold text-gray-200 ring-2 ring-[#792990]/30">
                          {issue.assignee.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
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
            <div className="rounded-lg border border-[#792990]/20 bg-[#792990]/5 p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#792990]/20 flex items-center justify-center mb-4">
                <Circle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-300 text-base">No issues found</p>
              <p className="text-gray-500 text-sm mt-1">Create your first issue to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
