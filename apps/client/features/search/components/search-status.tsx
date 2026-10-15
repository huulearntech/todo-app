"use client";

import { LoaderCircleIcon, CornerDownLeftIcon } from "lucide-react";
import { AutocompleteStatus } from "@/components/reui/autocomplete";

export interface SearchStatusProps {
  isPending: boolean;
  isFetching: boolean;
  error: Error | null;
  query: string;
  totalResults: number;
}

export function SearchStatus({
  isPending,
  isFetching,
  error,
  query,
  totalResults,
}: SearchStatusProps) {
  let content: React.ReactNode = null;

  if (isPending || isFetching) {
    content = (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircleIcon className="size-3.5 animate-spin" />
        <span>Searching tasks, projects, labels...</span>
      </div>
    );
  } else if (error) {
    content = (
      <span className="text-xs text-destructive">
        {error.message || "Failed to search"}
      </span>
    );
  } else if (query && totalResults === 0) {
    content = (
      <div className="py-2 text-center text-xs text-muted-foreground">
        No matches found for &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
      </div>
    );
  } else if (totalResults > 0) {
    content = (
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalResults} result{totalResults === 1 ? "" : "s"} found
        </span>
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <CornerDownLeftIcon className="size-3" /> to navigate
        </span>
      </div>
    );
  }

  if (!content) return null;

  return (
    <AutocompleteStatus className="px-3 py-1.5 border-b border-border/40">
      {content}
    </AutocompleteStatus>
  );
}
