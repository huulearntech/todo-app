"use client";

import * as React from "react";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/date-time-picker";

import { priorityItems } from "@/lib/constants";
import { taskLabelService } from "@/services/task-label.service";
import { useQuery } from "@tanstack/react-query";
import { format, setHours, setMinutes } from "date-fns";
import {
  CalendarRangeIcon,
  ClockIcon,
  FlagIcon,
  Loader2Icon,
  SparklesIcon,
  TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: move to constants
export const priorityConfig = {
  high: {
    label: "High",
    color: "text-red-500 fill-red-500/20",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  medium: {
    label: "Medium",
    color: "text-amber-500 fill-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low",
    color: "text-blue-500 fill-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
} as const;

export interface TaskFormProps {
  defaultValues: CreateTaskInput;
  onSubmit: (data: CreateTaskOutput) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  autoFocusTitle?: boolean;
}

export function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = "Save changes",
  submittingLabel = "Saving...",
  autoFocusTitle = true,
}: TaskFormProps) {
  const anchor = useComboboxAnchor();

  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
    select: (data) => data.map((label) => ({ id: label.id, name: label.name, colorHexCode: label.colorHexCode })),
  });

  const {
    control,
    handleSubmit,
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
                  className="text-lg md:text-xl font-semibold placeholder:text-muted-foreground/40 border-0 p-0 focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent h-auto text-foreground"
                  autoFocus={autoFocusTitle}
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
                  placeholder="Add description, notes, or details..."
                  className="min-h-[120px] md:min-h-[160px] text-sm text-muted-foreground placeholder:text-muted-foreground/40 border-0 p-0 focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent resize-none leading-relaxed flex-1"
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </div>
            )}
          />

          {/* TODO: add comment?? */}
        </div>

        {/* Right Sidebar: Attributes Controls */}
        <aside className="p-5 bg-muted/20 dark:bg-muted/10 overflow-y-auto custom-kanban-scroll space-y-5">
          <FieldGroup className="space-y-4">
            {/* Priority Selector */}
            <Controller
              name="priority"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="priority"
                    className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                  >
                    <FlagIcon className="size-3.5" />
                    Priority
                  </FieldLabel>
                  <Select
                    id="priority"
                    items={priorityItems}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/80 hover:bg-background transition-colors text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="rounded-xl">
                      {priorityItems.map((item) => {
                        const config =
                          priorityConfig[item.value as keyof typeof priorityConfig];
                        return (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            className="text-xs rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <FlagIcon className={cn("size-3.5", config?.color)} />
                              <span>{item.label} Priority</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Labels Combobox */}
            <Controller
              name="labels"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-1.5">
                  <FieldLabel
                    htmlFor="labels-combobox"
                    className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                  >
                    <TagIcon className="size-3.5" />
                    Labels
                  </FieldLabel>

                  <Combobox
                    id="labels-combobox"
                    multiple
                    items={labels}
                    value={field.value.map((label) => label.id)}
                    onValueChange={(labelIds) => {
                      field.onChange(labelIds.map((id) => ({ id })));
                    }}
                  >
                    <ComboboxChips
                      ref={anchor}
                      className="min-h-9 rounded-xl border-border/60 bg-background/80 p-1 text-xs"
                    >
                      <ComboboxValue>
                        {field.value.map((fieldItem) => {
                          const label = labels.find((l) => l.id === fieldItem.id);
                          return label && (
                            <ComboboxChip
                              key={fieldItem.id}
                              className="text-xs rounded-md py-0.5 px-2"
                              style={{ backgroundColor: `color-mix(in srgb, ${label.colorHexCode} 10%, transparent` }}
                            >
                              {label.name}
                            </ComboboxChip>
                          );
                        })}
                        <ComboboxChipsInput
                          placeholder="Add labels..."
                          className="text-xs placeholder:text-muted-foreground/60"
                        />
                      </ComboboxValue>
                    </ComboboxChips>

                    <ComboboxEmpty className="text-xs p-2 text-muted-foreground">
                      No labels found
                    </ComboboxEmpty>

                    <ComboboxContent anchor={anchor} className="rounded-xl">
                      <ComboboxList>
                        {labels.map((label) => (
                          <ComboboxItem
                            key={label.id}
                            value={label.id}
                            className="text-xs rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <TagIcon className="size-3.5" style={{ color: label?.colorHexCode || undefined }} />
                              <span>{label.name}</span>
                            </div>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>

                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Time Range Selector */}
            <Controller
              name="timeRange"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-1.5">
                  <FieldLabel
                    htmlFor="timeRange"
                    className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                  >
                    <ClockIcon className="size-3.5" />
                    Time Range & Schedule
                  </FieldLabel>
                  <Select
                    value={field.value ? "custom" : "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        field.onChange(null);
                      } else if (value === "custom") {
                        if (field.value) return;

                        const now = new Date();
                        const start = setHours(setMinutes(now, 0), 9);
                        const end = setHours(setMinutes(now, 0), 17);
                        field.onChange({
                          start: {
                            date: format(start, "yyyy-MM-dd"),
                            time: format(start, "HH:mm"),
                          },
                          end: {
                            date: format(end, "yyyy-MM-dd"),
                            time: format(end, "HH:mm"),
                          },
                        });
                      }
                    }}
                    id="timeRange"
                    items={[
                      { value: "none", label: "No time scheduled" },
                      { value: "custom", label: "Schedule time range" },
                    ]}
                  >
                    <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/80 text-xs font-medium">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none" className="text-xs rounded-lg">
                        No time scheduled
                      </SelectItem>
                      <SelectItem value="custom" className="text-xs rounded-lg">
                        Schedule time range
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {field.value && (
                    <div className="pt-2 space-y-2.5 rounded-xl border border-border/50 bg-background/60 p-2.5">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="size-3 text-emerald-500" /> Start Time
                        </span>
                        <DateTimePicker
                          value={field.value.start}
                          onChange={(newValue) => {
                            field.onChange({
                              ...field.value,
                              start: newValue,
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-1 pt-1 border-t border-border/30">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="size-3 text-amber-500" /> End Time
                        </span>
                        <DateTimePicker
                          value={field.value.end}
                          onChange={(newValue) => {
                            field.onChange({
                              ...field.value,
                              end: newValue,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </aside>
      </div>

      {/* Footer Actions Bar */}
      <div className="border-t border-border/40 px-5 py-3 bg-muted/20 flex items-center justify-end gap-3 shrink-0">
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl h-8 text-xs font-medium px-4"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="task-form"
            size="sm"
            disabled={isSubmitting || isPending}
            className="rounded-xl h-8 text-xs font-semibold px-4 shadow-sm"
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
        </div>
      </div>
    </form>
  );
}
