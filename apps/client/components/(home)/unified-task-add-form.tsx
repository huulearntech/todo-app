"use client";

import {
  useRef,
  useState,
  useMemo,
  useId,
  useLayoutEffect,
  useEffect,
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
  syncProjectSectionToken,
  syncPriorityToken,
  syncDateToken,
  syncLabelToken,
  syncReminderToken,
  DEFAULT_REMINDER_SUGGESTIONS,
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

import {
  DatePickerPopover,
} from "./task-attribute-controls/date-picker-popover";
import {
  PriorityMenu,
} from "./task-attribute-controls/priority-menu";
import {
  LabelsPopover,
  type LabelItem,
} from "./task-attribute-controls/labels-popover";
import {
  ReminderPopover,
} from "./task-attribute-controls/reminder-popover";
import {
  ProjectSectionPopover,
} from "./task-attribute-controls/project-section-popover";
import { HighlightedTaskInput } from "./highlighted-task-input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

import {
  CornerDownLeftIcon,
  FileTextIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskPriority } from "@todo/shared";

const EMPTY_PROJECTS: Array<{ id: string; name: string; colorKey?: string }> = [];
const EMPTY_SECTIONS: Array<{ id: string; name: string; projectId: string }> = [];
const EMPTY_LABELS: LabelItem[] = [];

export interface UnifiedTaskAddFormProps {
  variant?: "dialog" | "inline";
  defaultProjectId?: string;
  defaultSectionId?: string;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UnifiedTaskAddForm({
  variant = "inline",
  defaultProjectId,
  defaultSectionId,
  autoFocus = false,
  className,
  placeholder = "Task name, e.g. Design review #Work/Sprint 1 %urgent p1 {tomorrow at 3pm}...",
  onSuccess,
  onCancel,
}: UnifiedTaskAddFormProps) {
  const { user } = useAuth();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const helpId = useId();

  // Primary text state
  const [rawText, setRawText] = useState("");
  const [caret, setCaret] = useState(0);
  const [dismissedToken, setDismissedToken] = useState<{
    start: number;
    query: string;
    trigger: string;
  } | null>(null);
  // Store highlighted item in ref to prevent continuous render cascades during autocomplete filtering
  const highlightedItemRef = useRef<SuggestionItemData | null>(null);

  // Description state
  const [description, setDescription] = useState("");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(variant === "dialog");

  // Explicit interactive overrides (when user clicks buttons rather than typing inline)
  const [manualProjectId, setManualProjectId] = useState<string | undefined>(defaultProjectId);
  const [manualSectionId, setManualSectionId] = useState<string | undefined>(defaultSectionId);
  const [manualPriority, setManualPriority] = useState<TaskPriority | null>(null);
  const [manualTimeRange, setManualTimeRange] = useState<
    { start: string; end: string } | null | undefined
  >(undefined);
  const [manualDateDisplay, setManualDateDisplay] = useState<string | undefined>(undefined);
  const [manualLabels, setManualLabels] = useState<LabelItem[]>([]);
  const [manualReminderOffset, setManualReminderOffset] = useState<
    number | null | undefined
  >(undefined);

  // Focus shortcut for inline variant
  useHotkey("Q", () => {
    if (variant === "inline") {
      taskInputRef.current?.focus();
    }
  });

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus) {
      taskInputRef.current?.focus();
    }
  }, [autoFocus]);

  // Query projects and labels
  const { data: projects = EMPTY_PROJECTS } = useProjects();
  const { data: labels = EMPTY_LABELS } = useLabels();

  // Autocomplete context detection
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

  // 1. Pre-parse with projects and labels to identify active project
  const preParsed = useMemo(
    () => parseQuickTaskInput(rawText, { projects, labels }),
    [rawText, projects, labels]
  );

  // Active project ID calculation:
  // Priority:
  // 1. Explicitly typed project in rawText (#...)
  // 2. Explicitly selected via dropdown (manualProjectId)
  // 3. Trigger context (defaultProjectId)
  // 4. User default project (Inbox)
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
    if (manualProjectId) return manualProjectId;
    if (defaultProjectId) return defaultProjectId;
    return user?.defaultProjectId;
  }, [
    sectionTargetProject,
    preParsed.projectName,
    projects,
    manualProjectId,
    defaultProjectId,
    user?.defaultProjectId,
  ]);

  // Query sections for active project
  const { data: sections = EMPTY_SECTIONS } = useSections(activeProjectId || "");

  // Filter suggestions for autocomplete
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
          colorKey: p.colorKey,
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
          colorKey: l.colorKey,
        }));
    }

    if (autocompleteCtx.kind === "reminder") {
      return DEFAULT_REMINDER_SUGGESTIONS.filter(
        (r) =>
          !query ||
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.token.toLowerCase().includes(query.toLowerCase())
      )
        .slice(0, 8)
        .map((r) => ({
          id: r.id,
          name: r.name,
          kind: "reminder" as const,
          token: r.token,
          minuteOffset: r.minuteOffset,
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

  const isDismissed = Boolean(
    dismissedToken &&
      autocompleteCtx &&
      dismissedToken.start === autocompleteCtx.start &&
      dismissedToken.trigger === autocompleteCtx.trigger &&
      dismissedToken.query === autocompleteCtx.query
  );

  const isSuggestionOpen = Boolean(
    autocompleteCtx &&
      !isDismissed &&
      (suggestions.length > 0 || !/\s/.test(autocompleteCtx.query))
  );

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
    const valueToInsert = item.token || item.name;
    const { text: nextText, caret: nextCaret } = applyAutocompleteSelection(
      rawText,
      autocompleteCtx,
      valueToInsert
    );
    setRawText(nextText);
    pendingCaretRef.current = nextCaret;
    setDismissedToken(null);
  };

  // 3. Parse raw input with projects, sections, and labels
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
      defaultProjectId: activeProjectId,
      defaultSectionId: manualSectionId || defaultSectionId,
    });
  }, [
    parsedRaw,
    projects,
    sections,
    labels,
    activeProjectId,
    manualSectionId,
    defaultSectionId,
  ]);

  // Active section calculation:
  // Priority:
  // 1. Explicitly typed section in rawText (/...)
  // 2. Explicitly selected via dropdown (manualSectionId)
  // 3. Trigger context defaultSectionId (if project matches)
  // 4. Resolved section or first section in project
  const activeSectionId = useMemo(() => {
    if (parsedRaw.sectionName && resolved.sectionId) {
      return resolved.sectionId;
    }
    if (manualSectionId) {
      return manualSectionId;
    }
    if (defaultSectionId && (!defaultProjectId || activeProjectId === defaultProjectId)) {
      return defaultSectionId;
    }
    return resolved.sectionId || sections[0]?.id;
  }, [
    parsedRaw.sectionName,
    resolved.sectionId,
    manualSectionId,
    defaultSectionId,
    defaultProjectId,
    activeProjectId,
    sections,
  ]);

  const activePriority: TaskPriority =
    manualPriority !== null
      ? manualPriority
      : resolved.priority;

  const isPriorityExplicit =
    manualPriority !== null || Boolean(parsedRaw.priority);

  const activeTimeRange =
    manualTimeRange !== undefined
      ? manualTimeRange
      : resolved.timeRange;

  const activeDateDisplay =
    manualDateDisplay !== undefined
      ? manualDateDisplay
      : resolved.dateDisplayText;

  const activeLabels = useMemo(() => {
    const map = new Map<string, LabelItem>();
    for (const l of resolved.labels) {
      map.set(l.id, l);
    }
    for (const l of manualLabels) {
      map.set(l.id, l);
    }
    return Array.from(map.values());
  }, [resolved.labels, manualLabels]);

  // Two-way synchronization handlers: clicking UI controls updates rawText inline shortcuts
  const handleToggleLabel = (label: LabelItem) => {
    const isCurrentlyActive = activeLabels.some((l) => l.id === label.id);
    const nextText = syncLabelToken(rawText, label.name, !isCurrentlyActive);
    setRawText(nextText);

    setManualLabels((prev) => {
      if (isCurrentlyActive) {
        return prev.filter((l) => l.id !== label.id);
      }
      return [...prev, label];
    });
  };

  const handleProjectSectionSelect = (projectId: string, sectionId?: string) => {
    setManualProjectId(projectId);
    setManualSectionId(sectionId);

    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      const sec = sections.find((s) => s.id === sectionId);
      const nextText = syncProjectSectionToken(rawText, proj.name, sec?.name);
      setRawText(nextText);
    }
  };

  const handlePrioritySelect = (priority: TaskPriority, isExplicit: boolean) => {
    setManualPriority(isExplicit ? priority : null);
    const nextText = syncPriorityToken(rawText, isExplicit ? priority : null);
    setRawText(nextText);
  };

  const handleDateChange = (
    timeRange: { start: string; end: string } | null,
    displayText?: string
  ) => {
    setManualTimeRange(timeRange);
    setManualDateDisplay(displayText);
    const nextText = syncDateToken(rawText, displayText);
    setRawText(nextText);
  };

  const activeReminderOffset =
    manualReminderOffset !== undefined
      ? manualReminderOffset
      : resolved.reminderMinutes !== undefined
      ? resolved.reminderMinutes
      : null;

  const activeReminders = useMemo(() => {
    if (activeReminderOffset !== null && activeReminderOffset !== undefined) {
      return [
        {
          type: "relative" as const,
          minuteOffset: activeReminderOffset,
          channel: "email" as const,
        },
      ];
    }
    return [];
  }, [activeReminderOffset]);

  const handleReminderChange = (minuteOffset: number | null) => {
    setManualReminderOffset(minuteOffset);
    const nextText = syncReminderToken(rawText, minuteOffset);
    setRawText(nextText);
  };

  // Task creation mutation
  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      setRawText("");
      setCaret(0);
      setDismissedToken(null);
      setDescription("");
      if (variant === "inline") {
        setIsDescriptionOpen(false);
      }
      setManualPriority(null);
      setManualTimeRange(undefined);
      setManualDateDisplay(undefined);
      setManualLabels([]);
      setManualReminderOffset(undefined);
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

    if (!activeSectionId) {
      toast.add({
        title: "Section not found",
        description:
          "Unable to determine target section. Please ensure the project has sections created.",
        type: "error",
      });
      return;
    }

    if (activeReminders.length > 0 && !activeTimeRange?.start) {
      toast.add({
        title: "Due date required for reminders",
        description:
          "Relative email reminders require a task due date or start time. Please add a date (e.g. {tomorrow 10am}) before submitting.",
        type: "error",
      });
      return;
    }

    let finalDescription = description.trim();
    if (resolved.description) {
      finalDescription = finalDescription
        ? `${finalDescription}\n\n${resolved.description}`
        : resolved.description;
    }

    createTaskMutation.mutate({
      title,
      description: finalDescription || "",
      priority: activePriority,
      sectionId: activeSectionId,
      timeRange: activeTimeRange,
      labels: activeLabels.map((l) => ({ id: l.id })),
      reminders: activeReminders,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isSuggestionOpen) {
      if (e.key === "Tab" || e.key === "Enter") {
        const target = highlightedItemRef.current || suggestions[0];
        if (target) {
          e.preventDefault();
          handleSelectSuggestion(target);
          return;
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (autocompleteCtx) {
          setDismissedToken({
            start: autocompleteCtx.start,
            query: autocompleteCtx.query,
            trigger: autocompleteCtx.trigger,
          });
        }
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
      if (isDescriptionOpen && variant === "inline") {
        setIsDescriptionOpen(false);
      } else if (rawText) {
        setRawText("");
        setCaret(0);
      } else {
        onCancel?.();
      }
    }
  };

  const isDialog = variant === "dialog";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 sm:p-4 shadow-sm transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10",
        isDialog && "border-0 shadow-none bg-transparent p-4 sm:p-5",
        className
      )}
    >
      {/* 1. Main Title Input & Autocomplete */}
      <div ref={inputRowRef} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center min-w-0">
          <Autocomplete
            items={suggestions}
            filteredItems={suggestions}
            value={rawText}
            onValueChange={(val, details) => {
              if (details.reason !== "item-press") {
                setRawText(val);
                setDismissedToken(null);
              }
            }}
            open={isSuggestionOpen}
            onOpenChange={(open, details) => {
              if (
                !open &&
                autocompleteCtx &&
                (details?.reason === "escape-key" || details?.reason === "outside-press")
              ) {
                setDismissedToken({
                  start: autocompleteCtx.start,
                  query: autocompleteCtx.query,
                  trigger: autocompleteCtx.trigger,
                });
              }
            }}
            onItemHighlighted={(item) => {
              highlightedItemRef.current = item ?? null;
            }}
            autoHighlight="always"
            itemToStringValue={(item) => item.name}
          >
            <AutocompleteInput
              ref={taskInputRef}
              render={
                <HighlightedTaskInput
                  type="text"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setDismissedToken(null);
                    syncCaret(e);
                  }}
                  onSelect={syncCaret}
                  onClick={syncCaret}
                  onKeyUp={syncCaret}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  aria-describedby={helpId}
                  disabled={createTaskMutation.isPending}
                  projects={projects}
                  sections={sections}
                  labels={labels}
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
                {autocompleteCtx?.kind === "reminder" && "No matching reminders"}
              </AutocompleteEmpty>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* Toggle description button (for inline variant) */}
        {!isDialog && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDescriptionOpen((prev) => !prev)}
            className={cn(
              "size-8 p-0 text-muted-foreground hover:text-foreground shrink-0",
              (isDescriptionOpen || Boolean(description || resolved.description)) &&
                "text-primary bg-primary/10 hover:bg-primary/20"
            )}
            title="Add description (or press ↓)"
          >
            <FileTextIcon className="size-4" />
          </Button>
        )}
      </div>

      {/* 2. Description Area */}
      {isDescriptionOpen && (
        <div className="relative pt-1 border-t border-border/30 transition-all">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Description..."
            rows={isDialog ? 3 : 2}
            className="w-full resize-none border-0 bg-transparent px-1 text-xs sm:text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* 3. Action Chips Row (Due Date, Priority, Labels, Reminder) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <DatePickerPopover
          value={activeTimeRange}
          displayText={activeDateDisplay}
          onChange={handleDateChange}
        />

        <PriorityMenu
          value={activePriority}
          isExplicit={isPriorityExplicit}
          onChange={handlePrioritySelect}
        />

        <LabelsPopover
          selectedLabels={activeLabels}
          availableLabels={labels}
          onToggleLabel={handleToggleLabel}
        />

        <ReminderPopover
          minuteOffset={activeReminderOffset}
          onChange={handleReminderChange}
          hasDueDate={Boolean(activeTimeRange?.start)}
        />
      </div>

      {/* 4. Footer Row (Project / Section selector & Submit / Cancel buttons) */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1">
        {/* Left: Project & Section Selector */}
        <ProjectSectionPopover
          currentProjectId={activeProjectId}
          currentSectionId={activeSectionId}
          projects={projects}
          onSelect={handleProjectSectionSelect}
        />

        {/* Right: Cancel & Add Task Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(isDialog || onCancel) && (
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
            disabled={!resolved.title.trim() || createTaskMutation.isPending}
            className="h-8 gap-1.5 rounded-xl px-3.5 text-xs font-semibold shadow-xs"
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
    </form>
  );
}
