"use client";

import {
  useRef,
  useState,
  useMemo,
  useId,
  useLayoutEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useAuth } from "@/providers/AuthProvider";
import { useProjects } from "@/hooks/projects/use-projects";
import { useSections } from "@/hooks/sections/use-sections";
import { useLabels } from "@/hooks/labels/use-labels";
import { useCreateTask } from "@/hooks/tasks/use-create-task";

import {
  parseQuickTaskInput,
  resolveQuickTask,
  getAutocompleteContext,
  applyAutocompleteSelection,
} from "@/lib/quick-task-parser";

import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteEmpty,
  useAutocompleteFilter,
} from "@/components/ui/autocomplete";
import {
  QuickTaskSuggestionItem,
  type SuggestionItemData,
} from "./quick-task-suggestion-item";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";

import {
  CalendarIcon,
  FlagIcon,
  TagIcon,
  FolderIcon,
  CornerDownLeftIcon,
  FileTextIcon,
  UserIcon,
  BellIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskPriority } from "@todo/shared";

export interface AddQuickTaskFormProps {
  defaultProjectId?: string;
  defaultSectionId?: string;
  className?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

const priorityBadgeStyles: Record<TaskPriority, { label: string; className: string }> = {
  [TaskPriority.HIGH]: {
    label: "P1 High",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  [TaskPriority.MEDIUM]: {
    label: "P2 Medium",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  [TaskPriority.LOW]: {
    label: "P3 Low",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
};

export default function AddQuickTaskForm({
  defaultProjectId,
  defaultSectionId,
  className,
  placeholder = "Add quick task (e.g. Finish slides #Work/Sprint1 %urgent p1 {tomorrow at 3pm} // Review with team)...",
  onSuccess,
}: AddQuickTaskFormProps) {
  const { user } = useAuth();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const helpId = useId();

  const [rawText, setRawText] = useState("");
  const [caret, setCaret] = useState(0);
  const [dismissedStart, setDismissedStart] = useState<number | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<SuggestionItemData | null>(null);
  const [descriptionManual, setDescriptionManual] = useState("");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  // Focus shortcut: Press 'Q' anywhere
  useHotkey("Q", () => {
    taskInputRef.current?.focus();
  });

  // Query entities for resolution
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels({
    select: (data) =>
      data.map((label) => ({
        id: label.id,
        name: label.name,
        colorHexCode: label.colorHexCode,
      })),
  });

  // Autocomplete context detection based on caret position
  const autocompleteCtx = useMemo(() => {
    return getAutocompleteContext(rawText, caret);
  }, [rawText, caret]);

  const autocompleteProjectName = autocompleteCtx?.projectName;

  // Determine target project for section suggestions if user typed #Project/
  const sectionTargetProject = useMemo(() => {
    if (autocompleteProjectName) {
      return (
        projects.find(
          (p) => p.name.toLowerCase() === autocompleteProjectName.toLowerCase()
        ) ||
        projects.find(
          (p) =>
            p.name.replace(/[\s\-_]/g, "").toLowerCase() ===
            autocompleteProjectName.replace(/[\s\-_]/g, "").toLowerCase()
        )
      );
    }
    return undefined;
  }, [autocompleteProjectName, projects]);

  // 1. Pre-parse with projects and labels to identify active project and fetch its sections
  const preParsed = useMemo(
    () => parseQuickTaskInput(rawText, { projects, labels }),
    [rawText, projects, labels]
  );

  // Determine active project to query associated sections
  const activeProjectId = useMemo(() => {
    if (sectionTargetProject) return sectionTargetProject.id;
    if (preParsed.projectName) {
      const matched =
        projects.find(
          (p) => p.name.toLowerCase() === preParsed.projectName?.toLowerCase()
        ) ||
        projects.find(
          (p) =>
            p.name.replace(/[\s\-_]/g, "").toLowerCase() ===
            preParsed.projectName?.replace(/[\s\-_]/g, "").toLowerCase()
        );
      if (matched) return matched.id;
    }
    return defaultProjectId || user?.defaultProjectId;
  }, [sectionTargetProject, preParsed.projectName, projects, defaultProjectId, user?.defaultProjectId]);

  // Query sections for active project
  const { data: sections = [] } = useSections(activeProjectId || "");

  // 2. Filter suggestions for the autocomplete dropdown
  const { contains } = useAutocompleteFilter({ sensitivity: "base" });
  const sectionTargetProjectName = sectionTargetProject?.name;

  const suggestions = useMemo<SuggestionItemData[]>(() => {
    if (!autocompleteCtx) return [];
    const query = autocompleteCtx.query.trim();

    if (autocompleteCtx.kind === "project") {
      return projects
        .filter((p) => !query || contains(p.name, query))
        .slice(0, 8)
        .map((p) => ({
          id: p.id,
          name: p.name,
          kind: "project",
          colorHexCode: p.colorHexCode,
          isDefault: p.id === user?.defaultProjectId,
        }));
    }

    if (autocompleteCtx.kind === "section") {
      return sections
        .filter((s) => !query || contains(s.name, query))
        .slice(0, 8)
        .map((s) => ({
          id: s.id,
          name: s.name,
          kind: "section",
          secondaryText:
            sectionTargetProjectName ||
            projects.find((p) => p.id === s.projectId)?.name,
        }));
    }

    if (autocompleteCtx.kind === "label") {
      return labels
        .filter((l) => !query || contains(l.name, query))
        .slice(0, 8)
        .map((l) => ({
          id: l.id,
          name: l.name,
          kind: "label",
          colorHexCode: l.colorHexCode,
        }));
    }

    return [];
  }, [
    autocompleteCtx,
    projects,
    sections,
    labels,
    contains,
    user?.defaultProjectId,
    sectionTargetProjectName,
  ]);

  const isDismissed =
    dismissedStart !== null && autocompleteCtx?.start === dismissedStart;

  const isSuggestionOpen = Boolean(
    autocompleteCtx &&
      !isDismissed &&
      (suggestions.length > 0 || !/\s/.test(autocompleteCtx.query))
  );

  // Sync caret position from input events
  const syncCaret = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const pos = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
    setCaret(pos);
  };

  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && taskInputRef.current) {
      const pos = pendingCaretRef.current;
      pendingCaretRef.current = null;
      taskInputRef.current.focus();
      taskInputRef.current.setSelectionRange(pos, pos);
      setCaret(pos);
    }
  }, [rawText]);

  const handleSelectSuggestion = (item: SuggestionItemData) => {
    if (!autocompleteCtx) return;
    const { text: nextText, caret: nextCaret } = applyAutocompleteSelection(
      rawText,
      autocompleteCtx,
      item.name
    );
    setRawText(nextText);
    pendingCaretRef.current = nextCaret;
    setDismissedStart(null);
  };

  // 3. Parse raw input with projects, sections, and labels for multi-word entity resolution
  const parsedRaw = useMemo(
    () => parseQuickTaskInput(rawText, { projects, sections, labels }),
    [rawText, projects, sections, labels]
  );

  // 4. Resolve entities and attributes
  const resolved = useMemo(() => {
    return resolveQuickTask(parsedRaw, {
      projects,
      sections,
      labels,
      defaultProjectId: defaultProjectId || user?.defaultProjectId,
      defaultSectionId,
    });
  }, [
    parsedRaw,
    projects,
    sections,
    labels,
    defaultProjectId,
    defaultSectionId,
    user?.defaultProjectId,
  ]);

  // Task creation mutation
  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      setRawText("");
      setCaret(0);
      setDismissedStart(null);
      setDescriptionManual("");
      setIsDescriptionOpen(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    const title = resolved.title.trim();
    if (!title) {
      toast.add({
        title: "Task title required",
        description: "Please enter a task title before submitting.",
        type: "error",
      });
      taskInputRef.current?.focus();
      return;
    }

    if (!resolved.sectionId) {
      toast.add({
        title: "Section not found",
        description:
          "Unable to determine target section. Please ensure the project has sections created.",
        type: "error",
      });
      return;
    }

    // Combine manual description and parsed inline description
    let finalDescription = descriptionManual.trim();
    if (resolved.description) {
      finalDescription = finalDescription
        ? `${finalDescription}\n\n${resolved.description}`
        : resolved.description;
    }

    createTaskMutation.mutate({
      title,
      description: finalDescription || "",
      priority: resolved.priority,
      sectionId: resolved.sectionId,
      timeRange: resolved.timeRange,
      labels: resolved.labels.map((l) => ({ id: l.id })),
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isSuggestionOpen) {
      if (e.key === "Tab" || e.key === "Enter") {
        const target = highlightedItem || suggestions[0];
        if (target) {
          e.preventDefault();
          handleSelectSuggestion(target);
          return;
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setDismissedStart(autocompleteCtx?.start ?? null);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        return;
      }
    }

    if (e.key === "ArrowDown" && !isDescriptionOpen) {
      e.preventDefault();
      setIsDescriptionOpen(true);
    } else if (e.key === "Escape") {
      if (isDescriptionOpen) {
        setIsDescriptionOpen(false);
      } else if (rawText) {
        setRawText("");
        setCaret(0);
      } else {
        taskInputRef.current?.blur();
      }
    }
  };

  const hasSpecialAttributes = Boolean(
    resolved.projectName ||
      resolved.sectionName ||
      resolved.labels.length > 0 ||
      parsedRaw.priority ||
      resolved.dateDisplayText ||
      resolved.description ||
      resolved.assignee ||
      resolved.reminder
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/60 p-2.5 sm:p-3 shadow-xs transition-all duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10",
        className
      )}
    >
      <div ref={inputRowRef} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center min-w-0">
          <Autocomplete
            items={suggestions}
            filteredItems={suggestions}
            value={rawText}
            onValueChange={(val, details) => {
              if (details.reason !== "item-press") {
                setRawText(val);
              }
            }}
            open={isSuggestionOpen}
            onOpenChange={(open) => {
              if (!open && autocompleteCtx) {
                setDismissedStart(autocompleteCtx.start);
              }
            }}
            onItemHighlighted={(item) => setHighlightedItem(item ?? null)}
            autoHighlight="always"
            itemToStringValue={(item) => item.name}
          >
            <AutocompleteInput
              ref={taskInputRef}
              render={
                <Input
                  type="text"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    syncCaret(e);
                  }}
                  onSelect={syncCaret}
                  onClick={syncCaret}
                  onKeyUp={syncCaret}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  aria-describedby={helpId}
                  disabled={createTaskMutation.isPending}
                  className="h-10 w-full border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                />
              }
            />

            <AutocompleteContent
              anchor={inputRowRef}
              align="start"
              side="bottom"
              sideOffset={6}
              className="w-72 sm:w-80"
            >
              <AutocompleteList>
                {(item: SuggestionItemData) => (
                  <QuickTaskSuggestionItem
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    query={autocompleteCtx?.query}
                    onSelect={handleSelectSuggestion}
                  />
                )}
              </AutocompleteList>
              <AutocompleteEmpty>
                {autocompleteCtx?.kind === "project" && "No matching projects"}
                {autocompleteCtx?.kind === "section" && "No matching sections"}
                {autocompleteCtx?.kind === "label" && "No matching labels"}
              </AutocompleteEmpty>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDescriptionOpen((prev) => !prev)}
            className={cn(
              "size-8 p-0 text-muted-foreground hover:text-foreground",
              (isDescriptionOpen || Boolean(descriptionManual || resolved.description)) &&
                "text-primary bg-primary/10 hover:bg-primary/20"
            )}
            title="Add or edit description (or press ↓)"
          >
            <FileTextIcon className="size-4" />
          </Button>

          <Button
            type="submit"
            disabled={!resolved.title.trim() || createTaskMutation.isPending}
            className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shrink-0"
          >
            {createTaskMutation.isPending ? (
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

      {/* Expandable Description Area */}
      {isDescriptionOpen && (
        <div className="relative pt-1 border-t border-border/40 transition-all">
          <Textarea
            value={descriptionManual}
            onChange={(e) => setDescriptionManual(e.target.value)}
            placeholder="Add description notes..."
            rows={2}
            className="w-full resize-none border-0 bg-transparent px-2 text-xs shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
          <div className="flex justify-end gap-1 px-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDescriptionOpen(false)}
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Live Recognized Attributes Preview Chips */}
      {hasSpecialAttributes && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5 border-t border-border/30">
          {/* Project & Section Badge */}
          {resolved.projectName && (
            <Badge
              variant="outline"
              className="gap-1.5 bg-muted/40 text-foreground font-normal text-[11px] py-0.5"
            >
              <FolderIcon className="size-3 text-muted-foreground" />
              {resolved.projectColor && (
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: resolved.projectColor }}
                />
              )}
              <span>#{resolved.projectName}</span>
              {resolved.sectionName && (
                <span className="text-muted-foreground">/{resolved.sectionName}</span>
              )}
            </Badge>
          )}

          {/* Section Only Badge (if no explicit project specified) */}
          {!resolved.projectName && resolved.sectionName && (
            <Badge
              variant="outline"
              className="gap-1 bg-muted/40 text-foreground font-normal text-[11px] py-0.5"
            >
              <FolderIcon className="size-3 text-muted-foreground" />
              <span>/{resolved.sectionName}</span>
            </Badge>
          )}

          {/* Labels Badges */}
          {resolved.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              className="gap-1 bg-muted/40 text-foreground font-normal text-[11px] py-0.5"
            >
              <TagIcon className="size-3 text-muted-foreground" />
              {label.colorHexCode && (
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: label.colorHexCode }}
                />
              )}
              <span>%{label.name}</span>
            </Badge>
          ))}

          {/* Priority Badge */}
          {parsedRaw.priority && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 font-medium text-[11px] py-0.5",
                priorityBadgeStyles[resolved.priority].className
              )}
            >
              <FlagIcon className="size-3" />
              <span>{priorityBadgeStyles[resolved.priority].label}</span>
            </Badge>
          )}

          {/* Due Date / Deadline Badge */}
          {resolved.dateDisplayText && (
            <Badge
              variant="outline"
              className="gap-1 bg-primary/10 text-primary border-primary/20 text-[11px] py-0.5"
            >
              <CalendarIcon className="size-3" />
              <span>{resolved.dateDisplayText}</span>
            </Badge>
          )}

          {/* Inline Description Preview */}
          {resolved.description && (
            <Badge
              variant="outline"
              className="gap-1 bg-muted/40 text-muted-foreground text-[11px] py-0.5 max-w-[220px] truncate"
            >
              <FileTextIcon className="size-3 shrink-0" />
              <span className="truncate">{"//"} {resolved.description}</span>
            </Badge>
          )}

          {/* Assignee Note Badge (unsupported backend feature preserved in description) */}
          {resolved.assignee && (
            <Badge
              variant="outline"
              className="gap-1 bg-muted/30 text-muted-foreground text-[11px] py-0.5"
              title="Assignee noted in task description"
            >
              <UserIcon className="size-3" />
              <span>+{resolved.assignee}</span>
            </Badge>
          )}

          {/* Reminder Note Badge (unsupported custom reminder offset preserved in description) */}
          {resolved.reminder && (
            <Badge
              variant="outline"
              className="gap-1 bg-muted/30 text-muted-foreground text-[11px] py-0.5"
              title="Email reminder automatically scheduled 15m before due date"
            >
              <BellIcon className="size-3" />
              <span>!{resolved.reminder}</span>
            </Badge>
          )}
        </div>
      )}

      {/* Syntax shortcuts hint banner */}
      <div id={helpId} className="flex items-center justify-between px-1 text-[11px] text-muted-foreground/60 select-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Shortcuts:</span>
          <span className="font-mono text-muted-foreground">#project</span>
          <span className="font-mono text-muted-foreground">/section</span>
          <span className="font-mono text-muted-foreground">%label</span>
          <span className="font-mono text-muted-foreground">p1..p4</span>
          <span className="font-mono text-muted-foreground">&#123;date&#125;</span>
          <span className="font-mono text-muted-foreground">{"//notes"}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Kbd>Q</Kbd>
          <span>to focus</span>
        </div>
      </div>
    </form>
  );
}