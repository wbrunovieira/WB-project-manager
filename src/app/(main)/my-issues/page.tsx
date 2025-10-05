import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MyIssuesClient } from "@/components/issues/my-issues-client";

export default async function MyIssuesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all issues assigned to or created by the user
  const issues = await prisma.issue.findMany({
    where: {
      OR: [
        { assigneeId: session.user.id },
        { creatorId: session.user.id },
      ],
    },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      labels: {
        include: {
          label: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Separate issues into assigned and created
  const assignedToMe = issues.filter((issue) => issue.assigneeId === session.user.id);
  const createdByMe = issues.filter((issue) => issue.creatorId === session.user.id);

  // Get user's first workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!workspaceMember) {
    redirect("/login");
  }

  const workspaceId = workspaceMember.workspaceId;

  // Get statuses, users, and projects for create modal
  const statuses = await prisma.status.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      workspaces: {
        some: { workspaceId },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div className="p-8">
      <MyIssuesClient
        assignedToMe={assignedToMe}
        createdByMe={createdByMe}
        statuses={statuses}
        users={users}
        projects={projects}
        workspaceId={workspaceId}
      />
    </div>
  );
}
