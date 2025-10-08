import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailHeader } from "@/components/projects/project-detail-header";
import { ProjectDates } from "@/components/projects/project-dates";
import { ProjectContentClient } from "@/components/projects/project-content-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      workspace: true,
      issues: {
        include: {
          status: true,
          assignee: true,
          milestone: true,
          feature: true,
          labels: {
            include: {
              label: true,
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Group issues by status type
  const issuesByStatus: Record<string, typeof project.issues> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
    CANCELED: [],
  };

  project.issues.forEach((issue) => {
    if (issuesByStatus[issue.status.type]) {
      issuesByStatus[issue.status.type].push(issue);
    }
  });

  const totalIssues = project.issues.length;
  const completedIssues = project.issues.filter(
    (issue) => issue.status.type === "DONE"
  ).length;
  const progress =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // Calculate feature statistics
  const featureStats = new Map<string, { name: string; color: string | null; count: number; labels: Map<string, { name: string; color: string; count: number }> }>();
  const labelStats = new Map<string, { name: string; color: string; count: number }>();

  project.issues.forEach((issue) => {
    // Count features
    if (issue.feature) {
      if (!featureStats.has(issue.feature.id)) {
        featureStats.set(issue.feature.id, {
          name: issue.feature.name,
          color: issue.feature.color,
          count: 0,
          labels: new Map(),
        });
      }
      const featureStat = featureStats.get(issue.feature.id)!;
      featureStat.count++;

      // Count labels within this feature
      issue.labels.forEach((issueLabel) => {
        if (!featureStat.labels.has(issueLabel.label.id)) {
          featureStat.labels.set(issueLabel.label.id, {
            name: issueLabel.label.name,
            color: issueLabel.label.color,
            count: 0,
          });
        }
        featureStat.labels.get(issueLabel.label.id)!.count++;
      });
    }

    // Count all labels (general)
    issue.labels.forEach((issueLabel) => {
      if (!labelStats.has(issueLabel.label.id)) {
        labelStats.set(issueLabel.label.id, {
          name: issueLabel.label.name,
          color: issueLabel.label.color,
          count: 0,
        });
      }
      labelStats.get(issueLabel.label.id)!.count++;
    });
  });

  // Get statuses and users for create modal
  const statuses = await prisma.status.findMany({
    where: { workspaceId: project.workspaceId },
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      workspaces: {
        some: {
          workspaceId: project.workspaceId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Get milestones for this project
  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id },
    include: {
      _count: {
        select: {
          issues: true,
        },
      },
      issues: {
        include: {
          status: true,
          feature: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-[#350459] p-8">
      {/* Header */}
      <div className="mb-12">
        <ProjectDetailHeader
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            targetDate: project.targetDate,
          }}
        />

        {/* Progress */}
        <div className="mt-6 max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {completedIssues} of {totalIssues} issues completed
            </span>
            <span className="font-medium text-gray-100">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#792990]/20">
            <div
              className="h-full bg-[#792990] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <ProjectDates
          startDate={project.startDate}
          targetDate={project.targetDate}
        />

        {/* Statistics */}
        <div className="mt-8 space-y-6">
          {/* Features Statistics */}
          {featureStats.size > 0 && (
            <div className="rounded-lg border border-[#792990]/30 bg-gradient-to-r from-[#792990]/5 to-transparent p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Issues por Feature</h3>
              <div className="space-y-4">
                {Array.from(featureStats.entries()).map(([featureId, feature]) => (
                  <div key={featureId} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-1 rounded"
                        style={{ backgroundColor: feature.color || "#792990" }}
                      />
                      <span className="font-medium text-gray-200">{feature.name}</span>
                      <span className="text-sm text-gray-400">
                        ({feature.count} {feature.count === 1 ? "issue" : "issues"})
                      </span>
                    </div>
                    {feature.labels.size > 0 && (
                      <div className="ml-6 flex flex-wrap gap-2">
                        {Array.from(feature.labels.entries()).map(([labelId, label]) => (
                          <div
                            key={labelId}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${label.color}20`,
                              color: label.color,
                              borderColor: `${label.color}40`,
                              borderWidth: "1px",
                            }}
                          >
                            <span>{label.name}</span>
                            <span className="text-[0.7rem] opacity-70">
                              {label.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels Statistics */}
          {labelStats.size > 0 && (
            <div className="rounded-lg border border-[#792990]/30 bg-gradient-to-r from-[#792990]/5 to-transparent p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Issues por Label (Geral)</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(labelStats.entries()).map(([labelId, label]) => (
                  <div
                    key={labelId}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      borderColor: `${label.color}40`,
                      borderWidth: "1px",
                    }}
                  >
                    <span>{label.name}</span>
                    <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                      {label.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Milestones and Issues Section */}
      <ProjectContentClient
        projectId={project.id}
        issuesByStatus={issuesByStatus}
        totalIssues={totalIssues}
        statuses={statuses}
        users={users}
        milestones={milestones}
        workspaceId={project.workspaceId}
      />
    </div>
  );
}
