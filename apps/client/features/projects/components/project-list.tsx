"use client";

import { useState, useMemo } from "react";
import type { ProjectResponseDto as Project } from "@todo/shared";
import { useModalStore } from "@/providers/MyStoreProvider";
import { ProjectCard } from "./project-card";
import { ProjectListEmptyState } from "./project-list-empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, PlusIcon } from "lucide-react";

export interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
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

export interface ProjectListContentProps {
  isLoading: boolean;
  projects: Project[];
  searchQuery: string;
  onClearSearch: () => void;
}

export function ProjectListContent({
  isLoading,
  projects,
  searchQuery,
  onClearSearch,
}: ProjectListContentProps) {
  const openModal = useModalStore((state) => state.openModal);

  if (isLoading) {
    return <ProjectListSkeleton />;
  }

  if (projects.length === 0) {
    return (
      <ProjectListEmptyState
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {/* Quick Add trigger at the bottom of the list */}
      <button
        type="button"
        onClick={() => openModal({ type: "add-project" })}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-card/40 hover:bg-accent/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer mt-1"
      >
        <PlusIcon className="size-4 text-primary" />
        <span>Add new project</span>
      </button>
    </div>
  );
}

export function ProjectList({
  projects,
  isLoading,
}: ProjectListProps) {
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

      <ProjectListContent
        isLoading={isLoading}
        projects={filteredProjects}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
      />
    </>
  );
}
