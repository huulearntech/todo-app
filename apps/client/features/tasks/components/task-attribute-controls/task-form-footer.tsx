"use client";

import { Button } from "@/components/ui/button";
import { CornerDownLeftIcon, Loader2Icon } from "lucide-react";
import { ProjectSectionPopover } from "./project-section-popover";

export interface TaskFormFooterProps {
  currentProjectId?: string;
  currentSectionId?: string;
  projects: Array<{ id: string; name: string; colorKey?: string }>;
  onProjectSectionSelect: (projectId: string, sectionId?: string) => void;
  onCancel?: () => void;
  canSubmit: boolean;
  isPending: boolean;
}

export function TaskFormFooter({
  currentProjectId,
  currentSectionId,
  projects,
  onProjectSectionSelect,
  onCancel,
  canSubmit,
  isPending,
}: TaskFormFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1">
      {/* Left: Project & Section Selector */}
      <ProjectSectionPopover
        currentProjectId={currentProjectId}
        currentSectionId={currentSectionId}
        projects={projects}
        onSelect={onProjectSectionSelect}
      />

      {/* Right: Cancel & Add Task Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={!canSubmit || isPending}
          className="h-8 gap-1.5 rounded-xl px-3.5 text-xs font-semibold shadow-xs"
        >
          {isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <>
              <span>Add Task</span>
              <CornerDownLeftIcon className="size-3 opacity-60" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
