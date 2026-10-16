"use client";

import { useProjects } from "@/features/projects/hooks/use-projects";
import AddProjectDialog from "@/features/projects/components/add-project-dialog";
import { ProjectList } from "@/features/projects/components/project-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderIcon, PlusIcon } from "lucide-react";

export function ProjectsContent({
  defaultProjectId,
}: {
  defaultProjectId: string;
}) {
  const { data: projects = [], isLoading } = useProjects("non_default");

  return (
    <>
      {/* Header section */}
      <div className="page-header-row">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <FolderIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">Projects</h1>
              {!isLoading && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  {projects.length}
                </Badge>
              )}
            </div>
            <p className="page-subtitle">
              Manage and organize your project boards and tasks.
            </p>
          </div>
        </div>

        <AddProjectDialog
          trigger={
            <Button className="gap-2 rounded-xl font-medium shrink-0 shadow-xs">
              <PlusIcon className="size-4" />
              <span>New Project</span>
            </Button>
          }
        />
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}
