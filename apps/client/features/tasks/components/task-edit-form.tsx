"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskSchema,
  type CreateTaskInput,
  type CreateTaskOutput,
} from "@todo/shared/browser";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Loader2Icon } from "lucide-react";

import { TaskEditPriorityField } from "./task-edit-fields/task-edit-priority-field";
import { TaskEditLabelsField } from "./task-edit-fields/task-edit-labels-field";
import { TaskEditScheduleField } from "./task-edit-fields/task-edit-schedule-field";
import { TaskEditReminderField } from "./task-edit-fields/task-edit-reminder-field";

export { priorityConfig } from "../constants/priority";

export interface TaskEditFormProps {
  defaultValues: CreateTaskInput;
  onSubmit: (data: CreateTaskOutput) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  autoFocusTitle?: boolean;
  readOnly?: boolean;
}

export function TaskEditForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = "Save changes",
  submittingLabel = "Saving...",
  autoFocusTitle = true,
  readOnly = false,
}: TaskEditFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateTaskInput, unknown, CreateTaskOutput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues,
  });

  return (
    <form
      id="task-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {/* Main Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border/40 overflow-hidden">
        {/* Left Column: Title, Description */}
        <div className="p-5 md:p-6 flex flex-col space-y-4 overflow-y-auto custom-kanban-scroll flex-1">
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Input
                  {...field}
                  id="task-title-input"
                  placeholder="Task title or what needs to be done..."
                  disabled={readOnly}
                  className="text-lg md:text-xl font-semibold placeholder:text-muted-foreground/40 border-0 px-2 py-1.5 rounded-none focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent h-auto text-foreground disabled:opacity-90"
                  autoFocus={!readOnly && autoFocusTitle}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-1 flex-1 flex flex-col">
                <Textarea
                  {...field}
                  id="task-description-input"
                  placeholder={readOnly ? "No description provided." : "Add description, notes, or details..."}
                  disabled={readOnly}
                  className="min-h-[120px] md:min-h-[160px] text-sm text-muted-foreground placeholder:text-muted-foreground/40 border-0 px-2 py-1.5 rounded-none focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent resize-none leading-relaxed flex-1 disabled:opacity-90"
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </div>
            )}
          />
        </div>

        {/* Right Sidebar: Attributes Controls */}
        <aside className="p-5 bg-muted/20 dark:bg-muted/10 overflow-y-auto custom-kanban-scroll space-y-5">
          <FieldGroup className="space-y-4">
            <TaskEditPriorityField control={control} />
            <TaskEditLabelsField control={control} />
            <TaskEditScheduleField control={control} />
            <TaskEditReminderField control={control} watch={watch} />
          </FieldGroup>
        </aside>
      </div>

      {/* Footer Actions Bar */}
      <div className="border-t border-border/40 px-5 py-3 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2 ml-auto">
          {readOnly ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-9 text-xs font-medium px-4"
              onClick={onCancel}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-9 text-xs font-medium px-4"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="task-form"
                disabled={isSubmitting || isPending}
                className="rounded-xl h-9 text-xs font-semibold px-4 shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                    {submittingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

// Backward compatibility aliases
export { TaskEditForm as TaskForm };
export type { TaskEditFormProps as TaskFormProps };

