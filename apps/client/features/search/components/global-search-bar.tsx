"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useHotkey } from "@tanstack/react-hotkeys";
import { SearchIcon } from "lucide-react";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteList,
  AutocompleteSeparator,
} from "@/components/reui/autocomplete";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";

import { useGlobalSearch } from "@/features/search/hooks/use-global-search";

import {
  SearchTaskItem,
  type SearchTaskItemData,
} from "./search-task-item";
import {
  SearchProjectItem,
  type SearchProjectItemData,
} from "./search-project-item";
import {
  SearchLabelItem,
  type SearchLabelItemData,
} from "./search-label-item";
import { SearchStatus } from "./search-status";

export type SearchTaskItem = SearchTaskItemData;
export type SearchProjectItem = SearchProjectItemData;
export type SearchLabelItem = SearchLabelItemData;
export type SearchItem = SearchTaskItem | SearchProjectItem | SearchLabelItem;

export default function GlobalSearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = useDebouncedValue(searchValue, { wait: 300 });

  // Global keyboard shortcuts via TanStack Hotkeys
  useHotkey("/", () => {
    inputRef.current?.focus();
  });

  const trimmedQuery = debouncedSearchValue.trim();

  const {
    data: searchResults,
    isPending,
    isFetching,
    error,
  } = useGlobalSearch(trimmedQuery);

  const tasks: SearchTaskItemData[] = useMemo(
    () =>
      searchResults?.tasks.map((t) => ({
        itemType: "task" as const,
        ...t,
      })) ?? [],
    [searchResults?.tasks]
  );

  const projects: SearchProjectItemData[] = useMemo(
    () =>
      searchResults?.projects.map((p) => ({
        itemType: "project" as const,
        ...p,
      })) ?? [],
    [searchResults?.projects]
  );

  const labels: SearchLabelItemData[] = useMemo(
    () =>
      searchResults?.labels.map((l) => ({
        itemType: "label" as const,
        ...l,
      })) ?? [],
    [searchResults?.labels]
  );

  const allItems: SearchItem[] = useMemo(
    () => [...tasks, ...projects, ...labels],
    [tasks, projects, labels]
  );

  const totalResults = allItems.length;
  const shouldRenderPopup = searchValue.trim().length > 0;

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      setSearchValue("");
      if (item.itemType === "project") {
        router.push(`/projects/${item.id}`);
      } else if (item.itemType === "label") {
        router.push(`/labels/${item.id}`);
      } else if (item.itemType === "task") {
        if (item.projectId) {
          router.push(`/projects/${item.projectId}`);
        } else {
          router.push("/inbox");
        }
      }
    },
    [router]
  );

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md transition-all">
      <Autocomplete
        items={allItems}
        value={searchValue}
        onValueChange={setSearchValue}
        itemToStringValue={(item: SearchItem) =>
          item.itemType === "task" ? item.title : item.name
        }
        filter={null}
      >
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <AutocompleteInput
            render={
              <Input
                data-slot="input-group-control"
                className="border-0 rounded-none shadow-none ring-0 focus-visible:ring-0 bg-transparent"
              />
            }
            ref={inputRef}
            placeholder="Search"
            showClear
            className="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent"
          />
          <InputGroupAddon align="inline-end">
            <KbdGroup>
              <Kbd>/</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>

        {shouldRenderPopup && (
          <AutocompleteContent
            align="start"
            sideOffset={6}
            className="w-(--anchor-width) min-w-[320px] max-w-[460px] rounded-xl border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-md"
          >
            <SearchStatus
              isPending={isPending}
              isFetching={isFetching}
              error={error}
              query={trimmedQuery}
              totalResults={totalResults}
            />

            <AutocompleteList scrollAreaClassName="max-h-[360px]">
              {/* Tasks Group */}
              {tasks.length > 0 && (
                <AutocompleteGroup>
                  <AutocompleteGroupLabel className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <span>Tasks</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                      {tasks.length}
                    </span>
                  </AutocompleteGroupLabel>

                  {tasks.map((task) => (
                    <SearchTaskItem
                      key={`task-${task.id}`}
                      task={task}
                      onSelect={handleSelectItem}
                    />
                  ))}
                </AutocompleteGroup>
              )}

              {/* Projects Group */}
              {projects.length > 0 && (
                <>
                  {tasks.length > 0 && <AutocompleteSeparator className="my-1" />}
                  <AutocompleteGroup>
                    <AutocompleteGroupLabel className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <span>Projects</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                        {projects.length}
                      </span>
                    </AutocompleteGroupLabel>

                    {projects.map((project) => (
                      <SearchProjectItem
                        key={`project-${project.id}`}
                        project={project}
                        onSelect={handleSelectItem}
                      />
                    ))}
                  </AutocompleteGroup>
                </>
              )}

              {/* Labels Group */}
              {labels.length > 0 && (
                <>
                  {(tasks.length > 0 || projects.length > 0) && (
                    <AutocompleteSeparator className="my-1" />
                  )}
                  <AutocompleteGroup>
                    <AutocompleteGroupLabel className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <span>Labels</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                        {labels.length}
                      </span>
                    </AutocompleteGroupLabel>

                    {labels.map((label) => (
                      <SearchLabelItem
                        key={`label-${label.id}`}
                        label={label}
                        onSelect={handleSelectItem}
                      />
                    ))}
                  </AutocompleteGroup>
                </>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        )}
      </Autocomplete>
    </div>
  );
}
