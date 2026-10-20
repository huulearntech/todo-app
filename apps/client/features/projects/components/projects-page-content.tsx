"use client";

import { useState } from "react";
import { useProjects, EMPTY_PROJECTS } from "@/features/projects/hooks/use-projects";
import AddProjectDialog from "@/features/projects/components/add-project-dialog";
import { ProjectList } from "@/features/projects/components/project-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderIcon, PlusIcon } from "lucide-react";

export function ProjectsPageContent({
  defaultProjectId,
}: {
  defaultProjectId: string;
}) {
  const [scope, setScope] = useState<"all" | "owned" | "shared">("all");
  const { data: projects = EMPTY_PROJECTS, isLoading } = useProjects({
    isDefault: false,
    scope,
  });

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

      {/* Scope Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs
          value={scope}
          onValueChange={(val) => setScope(val as "all" | "owned" | "shared")}
        >
          <TabsList variant="line" className="gap-4">
            <TabsTrigger value="all" className="cursor-pointer">
              All Projects
            </TabsTrigger>
            <TabsTrigger value="owned" className="cursor-pointer">
              Owned by me
            </TabsTrigger>
            <TabsTrigger value="shared" className="cursor-pointer">
              Shared with me
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}

// Backward compatibility alias
export { ProjectsPageContent as ProjectsContent };

