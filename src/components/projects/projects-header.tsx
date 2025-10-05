"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./create-project-modal";

interface ProjectsHeaderProps {
  workspaceId: string;
  projectCount: number;
}

export function ProjectsHeader({ workspaceId, projectCount }: ProjectsHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">
            {projectCount} project{projectCount !== 1 ? "s" : ""}
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <CreateProjectModal
        workspaceId={workspaceId}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
