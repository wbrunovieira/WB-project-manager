"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceModal } from "@/components/workspaces/create-workspace-modal";
import { EditWorkspaceModal } from "@/components/workspaces/edit-workspace-modal";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-dialog";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  role: string;
  _count: {
    members: number;
    projects: number;
  };
}

interface WorkspacesClientProps {
  workspaces: Workspace[];
}

export function WorkspacesClient({ workspaces }: WorkspacesClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
          <p className="mt-2 text-gray-600">
            Manage your workspaces and team collaboration
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                  {workspace.icon || "🏢"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">{workspace.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingWorkspace(workspace)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {workspace.role === "OWNER" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingWorkspace(workspace)}
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{workspace._count.members} members</span>
              </div>
              <div className="flex items-center gap-1">
                <FolderKanban className="h-4 w-4" />
                <span>{workspace._count.projects} projects</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {workspace.role}
              </span>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-full rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No workspaces found</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Workspace
            </Button>
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          open={!!editingWorkspace}
          onOpenChange={(open) => !open && setEditingWorkspace(null)}
        />
      )}

      {deletingWorkspace && (
        <DeleteWorkspaceDialog
          workspaceId={deletingWorkspace.id}
          workspaceName={deletingWorkspace.name}
          open={!!deletingWorkspace}
          onOpenChange={(open) => !open && setDeletingWorkspace(null)}
        />
      )}
    </>
  );
}
