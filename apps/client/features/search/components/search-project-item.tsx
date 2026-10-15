"use client";

import { HashIcon } from "lucide-react";
import { AutocompleteItem } from "@/components/reui/autocomplete";
import type { SearchProjectResultDto } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";

export type SearchProjectItemData = { itemType: "project" } & SearchProjectResultDto;

export interface SearchProjectItemProps {
  project: SearchProjectItemData;
  onSelect: (project: SearchProjectItemData) => void;
}

export function SearchProjectItem({ project, onSelect }: SearchProjectItemProps) {
  const projectConfig = getColorConfig(project.colorKey);

  return (
    <AutocompleteItem
      value={project}
      onClick={() => onSelect(project)}
      className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <HashIcon
          className={`size-4 shrink-0 ${projectConfig.badgeTextClass}`}
        />
        <span className="truncate text-sm font-medium">
          {project.name}
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
        Project
      </span>
    </AutocompleteItem>
  );
}
