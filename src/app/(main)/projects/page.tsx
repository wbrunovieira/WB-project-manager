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

  // Get user's workspaces
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
  });

  const projects = workspaceMemberships.flatMap((wm) => wm.workspace.projects);
  const workspaceId = workspaceMemberships[0]?.workspaceId || "";

  return (
    <div className="p-8">
      <ProjectsHeader workspaceId={workspaceId} projectCount={projects.length} />
      <ProjectsListClient projects={projects} />
    </div>
  );
}
