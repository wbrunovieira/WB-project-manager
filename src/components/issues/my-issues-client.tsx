"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Circle, CircleDot, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";

interface MyIssuesClientProps {
  assignedToMe: any[];
  createdByMe: any[];
  teams: Array<{ id: string; name: string; key: string; workspaceId: string }>;
  statuses: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function MyIssuesClient({
  assignedToMe,
  createdByMe,
  teams,
  statuses,
  users,
  projects,
}: MyIssuesClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600";
      case "HIGH":
        return "text-orange-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <AlertCircle className="h-4 w-4" />;
      case "HIGH":
        return <CircleDot className="h-4 w-4" />;
      case "MEDIUM":
        return <Circle className="h-4 w-4" />;
      case "LOW":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

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

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Issues</h1>
          <p className="mt-2 text-gray-600">
            {assignedToMe.length} assigned to me, {createdByMe.length} created by me
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Assigned to Me */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Assigned to me</h2>

        {assignedToMe.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No issues assigned to you</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Project
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignedToMe.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="group flex items-center gap-2"
                      >
                        {getStatusIcon(issue.status.type)}
                        <span className="font-mono text-xs text-gray-500">
                          {issue.team.key}-{issue.identifier}
                        </span>
                        <span className="text-sm text-gray-900 group-hover:text-blue-600">
                          {issue.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{issue.status.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 text-sm ${getPriorityColor(issue.priority)}`}>
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {issue.labels?.map((issueLabel: any) => (
                          <span
                            key={issueLabel.labelId}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${issueLabel.label.color}20`,
                              color: issueLabel.label.color,
                              border: `1px solid ${issueLabel.label.color}`,
                            }}
                          >
                            {issueLabel.label.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {issue.project ? (
                        <Link
                          href={`/projects/${issue.project.id}`}
                          className="text-sm text-gray-600 hover:text-blue-600"
                        >
                          {issue.project.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">No project</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Created by Me */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Created by me</h2>

        {createdByMe.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No issues created by you</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {createdByMe.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="group flex items-center gap-2"
                      >
                        {getStatusIcon(issue.status.type)}
                        <span className="font-mono text-xs text-gray-500">
                          {issue.team.key}-{issue.identifier}
                        </span>
                        <span className="text-sm text-gray-900 group-hover:text-blue-600">
                          {issue.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{issue.status.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 text-sm ${getPriorityColor(issue.priority)}`}>
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {issue.labels?.map((issueLabel: any) => (
                          <span
                            key={issueLabel.labelId}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${issueLabel.label.color}20`,
                              color: issueLabel.label.color,
                              border: `1px solid ${issueLabel.label.color}`,
                            }}
                          >
                            {issueLabel.label.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {issue.assignee ? (
                        <span className="text-sm text-gray-600">
                          {issue.assignee.name || issue.assignee.email}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateIssueModal
        teams={teams}
        statuses={statuses}
        users={users}
        projects={projects}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
