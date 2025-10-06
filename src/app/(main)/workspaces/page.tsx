import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkspacesClient } from "@/components/workspaces/workspaces-client";

export default async function WorkspacesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all workspaces the user is a member of
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
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

  const workspaces = workspaceMemberships.map((wm) => ({
    ...wm.workspace,
    role: wm.role,
  }));

  return (
    <div className="p-8">
      <WorkspacesClient workspaces={workspaces} />
    </div>
  );
}
