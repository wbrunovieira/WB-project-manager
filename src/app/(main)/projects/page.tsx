import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectsHeader } from "@/components/projects/projects-header";
import { ProjectsListClient } from "@/components/projects/projects-list-client";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's workspaces with projects
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: {
        include: {
          projects: {
            include: {
              issues: {
                include: {
                  status: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      workspace: {
        name: "asc",
      },
    },
  });

  // Group projects by workspace
  const workspacesWithProjects = workspaceMemberships.map((wm) => ({
    id: wm.workspaceId,
    name: wm.workspace.name,
    icon: wm.workspace.icon,
    projects: wm.workspace.projects.map((p) => ({
      ...p,
      workspace: {
        id: wm.workspace.id,
        name: wm.workspace.name,
        icon: wm.workspace.icon,
      },
    })),
  }));

  const workspaces = workspaceMemberships.map((wm) => ({
    id: wm.workspaceId,
    name: wm.workspace.name,
  }));

  const totalProjects = workspacesWithProjects.reduce(
    (sum, ws) => sum + ws.projects.length,
    0
  );

  return (
    <div className="min-h-screen bg-[#350459]">
      <div className="p-8">
        <ProjectsHeader workspaces={workspaces} projectCount={totalProjects} />
        <ProjectsListClient workspacesWithProjects={workspacesWithProjects} />
      </div>
    </div>
  );
}
