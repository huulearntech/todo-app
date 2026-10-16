"use client";

import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useSections } from "@/features/sections/hooks/use-sections";
import { useLabels } from "@/features/labels/hooks/use-labels";
import { useCreateTask } from "@/features/tasks/hooks/use-create-task";
import { useAutocompleteFilter } from "@/components/ui/autocomplete";
import { toast } from "@/components/ui/toast";
import { TaskPriority } from "@todo/shared";
import type { LabelItem } from "../components/task-attribute-controls/labels-popover";
import type { SuggestionItemData } from "../components/quick-task-suggestion-item";
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
} from "@/features/tasks/utils/quick-task-parser";

const EMPTY_PROJECTS: Array<{ id: string; name: string; colorKey?: string }> = [];
const EMPTY_SECTIONS: Array<{ id: string; name: string; projectId: string }> = [];
const EMPTY_LABELS: LabelItem[] = [];

export interface UseQuickTaskStateOptions {
  defaultProjectId?: string;
  defaultSectionId?: string;
  autoFocus?: boolean;
  taskInputRef: RefObject<HTMLInputElement | null>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useQuickTaskState({
  defaultProjectId,
  defaultSectionId,
  autoFocus = false,
  taskInputRef,
  onSuccess,
  onCancel,
}: UseQuickTaskStateOptions) {
  const { user } = useAuth();
  const pendingCaretRef = useRef<number | null>(null);
  const highlightedItemRef = useRef<SuggestionItemData | null>(null);

  // Primary text state
  const [rawText, setRawText] = useState("");
  const [caret, setCaret] = useState(0);
  const [dismissedToken, setDismissedToken] = useState<{
    start: number;
    query: string;
    trigger: string;
  } | null>(null);

  // Description state
  const [description, setDescription] = useState("");

  // Explicit interactive overrides
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

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus) {
      taskInputRef.current?.focus();
    }
  }, [autoFocus, taskInputRef]);

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
  }, [rawText, taskInputRef]);

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

  // Parse raw input with projects, sections, and labels
  const parsedRaw = useMemo(
    () => parseQuickTaskInput(rawText, { projects, sections, labels }),
    [rawText, projects, sections, labels]
  );

  // Resolve entities and attributes
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
    manualPriority !== null ? manualPriority : resolved.priority;

  const isPriorityExplicit =
    manualPriority !== null || Boolean(parsedRaw.priority);

  const activeTimeRange =
    manualTimeRange !== undefined ? manualTimeRange : resolved.timeRange;

  const activeDateDisplay =
    manualDateDisplay !== undefined ? manualDateDisplay : resolved.dateDisplayText;

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

  // Two-way synchronization handlers
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

  const handleReminderChange = (minuteOffset: number | null) => {
    setManualReminderOffset(minuteOffset);
    const nextText = syncReminderToken(rawText, minuteOffset);
    setRawText(nextText);
  };

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

  const createTaskMutation = useCreateTask({
    onSuccess: () => {
      setRawText("");
      setCaret(0);
      setDescription("");
      setManualPriority(null);
      setManualTimeRange(undefined);
      setManualDateDisplay(undefined);
      setManualLabels([]);
      setManualReminderOffset(undefined);
      setDismissedToken(null);
      onSuccess?.();
    },
  });

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    const title = resolved.title.trim();
    if (!title) {
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

    if (e.key === "Escape") {
      if (rawText) {
        setRawText("");
        setCaret(0);
      } else {
        onCancel?.();
      }
    }
  };

  return {
    rawText,
    setRawText,
    syncCaret,
    description,
    setDescription,
    projects,
    sections,
    labels,
    suggestions,
    autocompleteCtx,
    isSuggestionOpen,
    handleSelectSuggestion,
    highlightedItemRef,
    setDismissedToken,
    resolved,
    activeProjectId,
    activeSectionId,
    activePriority,
    isPriorityExplicit,
    handlePrioritySelect,
    activeTimeRange,
    activeDateDisplay,
    handleDateChange,
    activeLabels,
    handleToggleLabel,
    activeReminderOffset,
    handleReminderChange,
    handleProjectSectionSelect,
    handleSubmit,
    handleKeyDown,
    isPending: createTaskMutation.isPending,
  };
}
