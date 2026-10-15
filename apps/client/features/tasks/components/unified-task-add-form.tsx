"use client";

import { useRef, useId } from "react";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteEmpty,
} from "@/components/ui/autocomplete";
import {
  QuickTaskSuggestionItem,
  type SuggestionItemData,
} from "./quick-task-suggestion-item";
import { HighlightedTaskInput } from "./highlighted-task-input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQuickTaskState } from "@/features/tasks/hooks/use-quick-task-state";
import { TaskAttributeToolbar } from "./task-attribute-controls/task-attribute-toolbar";
import { TaskFormFooter } from "./task-attribute-controls/task-form-footer";

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
  defaultProjectId,
  defaultSectionId,
  autoFocus = false,
  className,
  placeholder = "Task name, e.g. Design review #Work/Sprint 1 %urgent p1 {tomorrow at 3pm}...",
  onSuccess,
  onCancel,
}: UnifiedTaskAddFormProps) {
  const taskInputRef = useRef<HTMLInputElement>(null);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const helpId = useId();

  const {
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
    isPending,
  } = useQuickTaskState({
    defaultProjectId,
    defaultSectionId,
    autoFocus,
    taskInputRef,
    onSuccess,
    onCancel,
  });

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-2.5 p-4 sm:p-5 bg-transparent",
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
                  disabled={isPending}
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
      </div>

      {/* 2. Description Area */}
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
          placeholder="Description"
          rows={3}
          className="w-full resize-none border-0 bg-transparent px-1 text-xs sm:text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* 3. Action Chips Row (Due Date, Priority, Labels, Reminder) */}
      <TaskAttributeToolbar
        timeRange={activeTimeRange}
        dateDisplay={activeDateDisplay}
        onDateChange={handleDateChange}
        priority={activePriority}
        isPriorityExplicit={isPriorityExplicit}
        onPrioritySelect={handlePrioritySelect}
        selectedLabels={activeLabels}
        availableLabels={labels}
        onToggleLabel={handleToggleLabel}
        reminderOffset={activeReminderOffset}
        onReminderChange={handleReminderChange}
      />

      {/* 4. Footer Row (Project / Section selector & Submit / Cancel buttons) */}
      <TaskFormFooter
        currentProjectId={activeProjectId}
        currentSectionId={activeSectionId}
        projects={projects}
        onProjectSectionSelect={handleProjectSectionSelect}
        onCancel={onCancel}
        canSubmit={Boolean(resolved.title.trim())}
        isPending={isPending}
      />
    </form>
  );
}
