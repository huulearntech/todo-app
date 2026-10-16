"use client";

import { useState, useMemo } from "react";
import type { ProjectResponseDto as Project } from "@todo/shared";
import { useModalStore } from "@/providers/MyStoreProvider";
import { ProjectCard } from "./project-card";
import AddProjectDialog from "./add-project-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { SearchIcon, FolderPlusIcon, PlusIcon } from "lucide-react";

export interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  defaultProjectId?: string | null;
}

export function ProjectListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

export function ProjectList({
  projects,
  isLoading,
  defaultProjectId,
}: ProjectListProps) {
  const openModal = useModalStore((state) => state.openModal);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  const handleCopyLink = (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(url);
    toast.add({
      title: "Link copied",
      description: "Project link has been copied to your clipboard.",
      type: "success",
    });
  };

  return (
    <>
      {/* Search bar */}
      <div className="relative w-full">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          size="lg"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects List */}
      {isLoading ? (
        <ProjectListSkeleton />
      ) : !filteredProjects.length ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/40">
          <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
            <FolderPlusIcon className="size-6" />
          </div>
          <h3 className="empty-state-title">
            {searchQuery ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="empty-state-description">
            {searchQuery
              ? `No projects found matching "${searchQuery}". Try a different keyword.`
              : "Create your first project to start organizing tasks into custom Kanban boards."}
          </p>
          {searchQuery ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="rounded-xl mt-4 text-xs font-medium"
            >
              Clear search
            </Button>
          ) : (
            <AddProjectDialog
              trigger={
                <Button
                  size="sm"
                  className="gap-2 rounded-xl mt-4 text-xs font-semibold shadow-xs"
                >
                  <PlusIcon className="size-3.5" />
                  <span>Create Project</span>
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isDefault={defaultProjectId === project.id}
              onEdit={(project) => openModal({ type: "edit-project", project })}
              onCopyLink={handleCopyLink}
            />
          ))}

          {/* Quick Add trigger at the bottom of the list */}
          <AddProjectDialog
            trigger={
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-card/40 hover:bg-accent/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer mt-1"
              >
                <PlusIcon className="size-4 text-primary" />
                <span>Add new project</span>
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
