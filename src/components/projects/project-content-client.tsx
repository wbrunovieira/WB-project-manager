"use client";

import { useState, useEffect } from "react";
import { ProjectMilestonesClient } from "@/components/milestones/project-milestones-client";
import { ProjectIssuesClient } from "@/components/projects/project-issues-client";

interface ProjectContentClientProps {
  projectId: string;
  issuesByStatus: Record<string, any[]>;
  totalIssues: number;
  statuses: Array<{ id: string; name: string; type: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  milestones: any[];
  workspaceId: string;
}

export function ProjectContentClient({
  projectId,
  issuesByStatus: initialIssuesByStatus,
  totalIssues,
  statuses,
  users,
  milestones,
  workspaceId,
}: ProjectContentClientProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [filteredIssuesByStatus, setFilteredIssuesByStatus] = useState(initialIssuesByStatus);
  const [filteredTotalIssues, setFilteredTotalIssues] = useState(totalIssues);

  // Update filtered issues when milestone selection changes
  useEffect(() => {
    if (selectedMilestoneId) {
      const filtered = Object.entries(initialIssuesByStatus).reduce((acc, [statusType, issues]) => {
        acc[statusType] = issues.filter((issue) => issue.milestoneId === selectedMilestoneId);
        return acc;
      }, {} as Record<string, any[]>);

      setFilteredIssuesByStatus(filtered);
      setFilteredTotalIssues(Object.values(filtered).flat().length);
    } else {
      setFilteredIssuesByStatus(initialIssuesByStatus);
      setFilteredTotalIssues(totalIssues);
    }
  }, [selectedMilestoneId, initialIssuesByStatus, totalIssues]);

  return (
    <>
      {/* Milestones Section */}
      <div className="mb-12">
        <ProjectMilestonesClient
          projectId={projectId}
          milestones={milestones}
          selectedMilestoneId={selectedMilestoneId}
          onMilestoneSelect={setSelectedMilestoneId}
        />
      </div>

      {/* Divider */}
      <div className="mb-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[#792990]/30 to-transparent" />
      </div>

      {/* Issues Section */}
      <ProjectIssuesClient
        projectId={projectId}
        issuesByStatus={filteredIssuesByStatus}
        totalIssues={filteredTotalIssues}
        statuses={statuses}
        users={users}
        milestones={milestones.map((m) => ({ id: m.id, name: m.name }))}
        workspaceId={workspaceId}
        key={selectedMilestoneId || "all"}
      />
    </>
  );
}
