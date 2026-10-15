"use client";

import { TagIcon } from "lucide-react";
import { AutocompleteItem } from "@/components/reui/autocomplete";
import type { SearchLabelResultDto } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";

export type SearchLabelItemData = { itemType: "label" } & SearchLabelResultDto;

export interface SearchLabelItemProps {
  label: SearchLabelItemData;
  onSelect: (label: SearchLabelItemData) => void;
}

export function SearchLabelItem({ label, onSelect }: SearchLabelItemProps) {
  const labelConfig = getColorConfig(label.colorKey);

  return (
    <AutocompleteItem
      value={label}
      onClick={() => onSelect(label)}
      className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <TagIcon
          className={`size-3.5 shrink-0 ${labelConfig.badgeTextClass}`}
        />
        <span className="truncate text-sm font-medium">
          {label.name}
        </span>
      </div>
      <span className="text-[11px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
        Label
      </span>
    </AutocompleteItem>
  );
}
