"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: Date | null;
  targetDate?: Date | null;
}

interface ProjectDetailHeaderProps {
  project: Project;
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-gray-100 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">{project.name}</h1>
          {project.description && (
            <p className="mt-2 text-gray-300">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              project.status === "IN_PROGRESS"
                ? "bg-[#792990]/20 text-[#FFB947] border border-[#792990]/40"
                : project.status === "COMPLETED"
                ? "bg-[#792990]/20 text-green-400 border border-[#792990]/40"
                : project.status === "PLANNED"
                ? "bg-[#792990]/20 text-gray-300 border border-[#792990]/40"
                : "bg-[#792990]/20 text-red-400 border border-[#792990]/40"
            }`}
          >
            {project.status.replace("_", " ")}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditModalOpen(true)}
            className="border-[#792990]/40 bg-[#792990]/5 text-gray-100 hover:bg-[#792990]/10 hover:border-[#792990]/60"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-[#792990]/40 bg-[#792990]/5 text-red-400 hover:bg-[#792990]/10 hover:border-[#792990]/60 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditProjectModal
        project={project}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <DeleteProjectDialog
        projectId={project.id}
        projectName={project.name}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
