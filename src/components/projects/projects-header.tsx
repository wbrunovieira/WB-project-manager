"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "./create-project-modal";

interface ProjectsHeaderProps {
  workspaces: Array<{ id: string; name: string }>;
}

export function ProjectsHeader({ workspaces }: ProjectsHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Projects
        </h1>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 bg-accent font-medium text-accent-ink hover:bg-accent-hover"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </Button>
      </div>

      <CreateProjectModal
        workspaces={workspaces}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
