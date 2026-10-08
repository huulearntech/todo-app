"use client";

import * as React from "react";
import { FolderIcon, TagIcon, LayersIcon } from "lucide-react";
import { AutocompleteItem } from "@/components/ui/autocomplete";

export interface SuggestionItemData {
  id: string;
  name: string;
  kind: "project" | "section" | "label";
  colorHexCode?: string;
  secondaryText?: string;
  isDefault?: boolean;
}

interface QuickTaskSuggestionItemProps {
  item: SuggestionItemData;
  query?: string;
  onSelect: (item: SuggestionItemData) => void;
}

export function QuickTaskSuggestionItem({
  item,
  query = "",
  onSelect,
}: QuickTaskSuggestionItemProps) {
  // Highlight matched query substring if found
  const renderedName = React.useMemo(() => {
    if (!query.trim()) return item.name;
    const lowerName = item.name.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerName.indexOf(lowerQuery);
    if (index === -1) return item.name;

    const before = item.name.slice(0, index);
    const match = item.name.slice(index, index + query.length);
    const after = item.name.slice(index + query.length);

    return (
      <>
        {before}
        <span className="font-semibold text-primary underline underline-offset-2">
          {match}
        </span>
        {after}
      </>
    );
  }, [item.name, query]);

  return (
    <AutocompleteItem
      value={item}
      onClick={() => onSelect(item)}
      className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        {item.kind === "project" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <FolderIcon className="size-3.5 text-muted-foreground" />
            {item.colorHexCode && (
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.colorHexCode }}
              />
            )}
          </div>
        )}

        {item.kind === "section" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <LayersIcon className="size-3.5 text-muted-foreground" />
          </div>
        )}

        {item.kind === "label" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <TagIcon className="size-3.5 text-muted-foreground" />
            {item.colorHexCode && (
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.colorHexCode }}
              />
            )}
          </div>
        )}

        <span className="truncate font-medium text-foreground">
          {renderedName}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
        {item.secondaryText && (
          <span className="truncate max-w-[120px]">{item.secondaryText}</span>
        )}
        {item.isDefault && (
          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground/80 font-normal">
            Inbox
          </span>
        )}
      </div>
    </AutocompleteItem>
  );
}
