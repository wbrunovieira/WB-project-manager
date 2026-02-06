"use client";

import { useState, useEffect } from "react";
import { ProjectMilestonesClient } from "@/components/milestones/project-milestones-client";
import { ProjectIssuesClient } from "@/components/projects/project-issues-client";

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string | null;
  type: string;
  priority: string;
  statusId: string;
  projectId: string | null;
  workspaceId: string;
  milestoneId?: string | null;
  featureId?: string | null;
  sortOrder: number;
  reportedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  firstResponseAt?: string | null;
  resolutionTimeMinutes?: number | null;
  reopenCount: number;
  status: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  milestone?: {
    id: string;
    name: string;
  } | null;
  feature?: {
    id: string;
    name: string;
    color?: string | null;
    description?: string | null;
  } | null;
  labels: Array<{
    labelId: string;
    label: {
      name: string;
      color: string;
    };
  }>;
}

interface Milestone {
  id: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  targetDate?: Date | null;
  _count: {
    issues: number;
  };
  issues?: Array<{
    status: {
      type: string;
    };
    feature?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  }>;
}

interface ProjectContentClientProps {
  projectId: string;
  issuesByStatus: Record<string, Issue[]>;
  totalIssues: number;
  statuses: Array<{ id: string; name: string; type: string }>;
  users: Array<{ id: string; name: string | null; email: string }>;
  milestones: Milestone[];
  workspaceId: string;
}

export function ProjectContentClient({
  projectId,
  issuesByStatus: initialIssuesByStatus,
  totalIssues,
  statuses,
  users,
  milestones: initialMilestones,
  workspaceId,
}: ProjectContentClientProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [filteredIssuesByStatus, setFilteredIssuesByStatus] = useState(initialIssuesByStatus);
  const [filteredTotalIssues, setFilteredTotalIssues] = useState(totalIssues);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [issueUpdateTrigger, setIssueUpdateTrigger] = useState(0);

  // Update filtered issues when milestone selection changes
  useEffect(() => {
    if (selectedMilestoneId) {
      const filtered = Object.entries(initialIssuesByStatus).reduce((acc, [statusType, issues]) => {
        acc[statusType] = issues.filter((issue) => issue.milestoneId === selectedMilestoneId);
        return acc;
      }, {} as Record<string, Issue[]>);

      setFilteredIssuesByStatus(filtered);
      setFilteredTotalIssues(Object.values(filtered).flat().length);
    } else {
      setFilteredIssuesByStatus(initialIssuesByStatus);
      setFilteredTotalIssues(totalIssues);
    }
  }, [selectedMilestoneId, initialIssuesByStatus, totalIssues]);

  // Function to refresh milestones data
  const refreshMilestones = async () => {
    try {
      const response = await fetch(`/api/milestones?projectId=${projectId}`);
      if (response.ok) {
        const updatedMilestones = await response.json();
        setMilestones(updatedMilestones);
      }
    } catch (error) {
      console.error("Failed to refresh milestones:", error);
    }
  };

  // Handle when a new issue is created
  const handleIssueCreated = async () => {
    // Refresh milestones to update counts and stats
    await refreshMilestones();
  };

  // Handle when an issue is updated (status change, etc)
  const handleIssueUpdated = async () => {
    // Refresh milestones to update progress and stats
    await refreshMilestones();
    // Trigger update counter to force re-render
    setIssueUpdateTrigger(prev => prev + 1);
  };

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
        onIssueCreated={handleIssueCreated}
        onIssueUpdated={handleIssueUpdated}
        key={`${selectedMilestoneId || "all"}-${issueUpdateTrigger}`}
      />
    </>
  );
}
