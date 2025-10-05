"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";

interface ProjectIssuesClientProps {
  projectId: string;
  issuesByStatus: Record<string, any[]>;
  totalIssues: number;
  teams: Array<{ id: string; name: string; key: string }>;
  statuses: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
}

export function ProjectIssuesClient({
  projectId,
  issuesByStatus,
  totalIssues,
  teams,
  statuses,
  users,
}: ProjectIssuesClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Issues</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(issuesByStatus).map(([statusType, issues]) => {
          if (issues.length === 0) return null;

          const statusName =
            issues[0]?.status.name || statusType.replace("_", " ");

          return (
            <div key={statusType}>
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {statusName} ({issues.length})
              </h3>

              <div className="space-y-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm font-mono text-gray-500">
                        {issue.team.key}-{issue.identifier}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Labels */}
                      {issue.labels.map((issueLabel: any) => (
                        <span
                          key={issueLabel.labelId}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${issueLabel.label.color}20`,
                            color: issueLabel.label.color,
                          }}
                        >
                          {issueLabel.label.name}
                        </span>
                      ))}

                      {/* Priority */}
                      {issue.priority !== "NO_PRIORITY" && (
                        <span
                          className={`text-xs font-medium ${
                            issue.priority === "URGENT"
                              ? "text-red-600"
                              : issue.priority === "HIGH"
                              ? "text-orange-600"
                              : issue.priority === "MEDIUM"
                              ? "text-blue-600"
                              : "text-gray-500"
                          }`}
                        >
                          {issue.priority}
                        </span>
                      )}

                      {/* Assignee */}
                      {issue.assignee && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
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

        {totalIssues === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No issues in this project yet</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Issue
            </Button>
          </div>
        )}
      </div>

      <CreateIssueModal
        teams={teams}
        statuses={statuses}
        users={users}
        projects={[]}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        defaultProjectId={projectId}
      />
    </>
  );
}
