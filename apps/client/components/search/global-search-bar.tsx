"use client";

import {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";
import {
  SearchIcon,
  TagIcon,
  HashIcon,
  CircleIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  CornerDownLeftIcon,
} from "lucide-react";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteSeparator,
  AutocompleteStatus,
} from "@/components/reui/autocomplete";

import { Kbd, KbdGroup } from "@/components/ui/kbd";

import {
  type SearchProjectResultDto,
  type SearchLabelResultDto,
  type SearchTaskResultDto,
  type SearchResultsDto,
  TaskPriority,
} from "@todo/shared";
import { searchService } from "@/services/search.service";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { Input } from "../ui/input";

export type SearchTaskItem = { itemType: "task" } & SearchTaskResultDto;
export type SearchProjectItem = { itemType: "project" } & SearchProjectResultDto;
export type SearchLabelItem = { itemType: "label" } & SearchLabelResultDto;
export type SearchItem = SearchTaskItem | SearchProjectItem | SearchLabelItem;

export default function GlobalSearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = useDebouncedValue(searchValue, { wait: 300 });

  // Global keyboard shortcuts via TanStack Hotkeys
  useHotkeys([
    {
      hotkey: "Mod+K", callback: () => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    },
    {
      hotkey: "/", callback: () => {
        inputRef.current?.focus();
      }
    }
  ]);

  const trimmedQuery = debouncedSearchValue.trim();

  const {
    data: searchResults,
    isPending,
    isFetching,
    error,
  } = useQuery<SearchResultsDto, Error>({
    queryKey: ["global-search", trimmedQuery],
    queryFn: async () => {
      if (!trimmedQuery) {
        return { projects: [], labels: [], tasks: [] };
      }
      return searchService.search(trimmedQuery);
    },
    enabled: trimmedQuery.length > 0,
    staleTime: 1000 * 30, // 30s cache
  });

  const tasks: SearchTaskItem[] = useMemo(
    () =>
      searchResults?.tasks.map((t) => ({
        itemType: "task" as const,
        ...t,
      })) ?? [],
    [searchResults?.tasks]
  );

  const projects: SearchProjectItem[] = useMemo(
    () =>
      searchResults?.projects.map((p) => ({
        itemType: "project" as const,
        ...p,
      })) ?? [],
    [searchResults?.projects]
  );

  const labels: SearchLabelItem[] = useMemo(
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

  let status: ReactNode = "";
  if (isPending || isFetching) {
    status = (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircleIcon className="size-3.5 animate-spin" />
        <span>Searching tasks, projects, labels...</span>
      </div>
    );
  } else if (error) {
    status = (
      <span className="text-xs text-destructive">
        {error.message || "Failed to search"}
      </span>
    );
  } else if (trimmedQuery && totalResults === 0) {
    status = (
      <div className="py-2 text-center text-xs text-muted-foreground">
        No matches found for &ldquo;<span className="font-medium text-foreground">{trimmedQuery}</span>&rdquo;
      </div>
    );
  } else if (totalResults > 0) {
    status = (
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
          <AutocompleteInput render={<Input data-slot="input-group-control" />}
            ref={inputRef}
            placeholder="Search"
            showClear
            className="flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent"
          />
          <InputGroupAddon align="inline-end">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>

        {shouldRenderPopup && (
          <AutocompleteContent
            align="start"
            sideOffset={6}
            className="w-(--anchor-width) min-w-[320px] max-w-[460px] rounded-xl border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-md"
          >
            {status && (
              <AutocompleteStatus className="px-3 py-1.5 border-b border-border/40">
                {status}
              </AutocompleteStatus>
            )}

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

                  {tasks.map((task) => {
                    const isCompleted = Boolean(task.completedAt);
                    const priorityColor =
                      task.priority === TaskPriority.HIGH
                        ? "text-red-500"
                        : task.priority === TaskPriority.MEDIUM
                        ? "text-orange-500"
                        : task.priority === TaskPriority.LOW
                        ? "text-blue-500"
                        : "text-muted-foreground/50";

                    return (
                      <AutocompleteItem
                        key={`task-${task.id}`}
                        value={task}
                        onClick={() => handleSelectItem(task)}
                        className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isCompleted ? (
                            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                          ) : (
                            <CircleIcon
                              className={cn(
                                "size-3.5 shrink-0 transition-transform group-hover:scale-110",
                                priorityColor
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "truncate text-sm font-medium",
                              isCompleted &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </span>
                        </div>

                        {task.projectName && (
                          <div className="flex items-center gap-1.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground bg-muted/60">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  task.projectColorHexCode || "#808080",
                              }}
                            />
                            <span className="max-w-[100px] truncate">
                              {task.projectName}
                            </span>
                          </div>
                        )}
                      </AutocompleteItem>
                    );
                  })}
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
                      <AutocompleteItem
                        key={`project-${project.id}`}
                        value={project}
                        onClick={() => handleSelectItem(project)}
                        className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <HashIcon
                            className="size-4 shrink-0"
                            style={{
                              color: project.colorHexCode || "#808080",
                            }}
                          />
                          <span className="truncate text-sm font-medium">
                            {project.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
                          Project
                        </span>
                      </AutocompleteItem>
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
                      <AutocompleteItem
                        key={`label-${label.id}`}
                        value={label}
                        onClick={() => handleSelectItem(label)}
                        className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <TagIcon
                            className="size-3.5 shrink-0"
                            style={{
                              color: label.colorHexCode || "#808080",
                            }}
                          />
                          <span className="truncate text-sm font-medium">
                            {label.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
                          Label
                        </span>
                      </AutocompleteItem>
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
