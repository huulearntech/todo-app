"use client";

import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/providers/MyStoreProvider";

export interface ProjectListEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export function ProjectListEmptyState({
  searchQuery,
  onClearSearch,
}: ProjectListEmptyStateProps) {
  const isSearchEmpty = Boolean(searchQuery.trim());
  const openModal = useModalStore((state) => state.openModal);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/40">
      <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
        <FolderPlusIcon className="size-6" />
      </div>
      <h3 className="empty-state-title">
        {isSearchEmpty ? "No matching projects" : "No projects yet"}
      </h3>
      <p className="empty-state-description">
        {isSearchEmpty
          ? `No projects found matching "${searchQuery}". Try a different keyword.`
          : "Create your first project to start organizing tasks into custom Kanban boards."}
      </p>
      {isSearchEmpty ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          className="rounded-xl mt-4 text-xs font-medium cursor-pointer"
        >
          Clear search
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => openModal({ type: "add-project" })}
          className="gap-2 rounded-xl mt-4 text-xs font-semibold shadow-xs cursor-pointer"
        >
          <PlusIcon className="size-3.5" />
          <span>Create Project</span>
        </Button>
      )}
    </div>
  );
}
