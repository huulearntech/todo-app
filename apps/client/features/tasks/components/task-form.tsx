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
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
} from "@/components/ui/combobox";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { DateTimePicker } from "@/components/ui/date-time-picker";

import { priorityItems } from "@/lib/constants";
import { useLabels } from "@/features/labels/hooks/use-labels";
import { format, setHours, setMinutes } from "date-fns";
import {
  AlarmClockIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  Loader2Icon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { getColorConfig } from "@/lib/color-palette";
import { cn } from "@/lib/utils";

interface LabelComboboxItemProps extends ComboboxPrimitive.Item.Props {
  label: {
    id: string;
    name: string;
    colorKey?: string | null;
  };
  isSelected: boolean;
}

function LabelComboboxItem({
  label,
  isSelected,
  className,
  ...props
}: LabelComboboxItemProps) {
  return (
    <ComboboxPrimitive.Item
      value={label.id}
      className={cn(
        "group/item relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1.5 px-2.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* 1. Leading Checkbox */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-transparent group-hover/item:border-input/80 dark:bg-input/30"
        )}
      >
        {isSelected && <CheckIcon className="size-3.5 stroke-[2.5]" />}
      </span>

      {/* 2. Label Name in Middle */}
      <span className="flex-1 truncate font-normal text-foreground">
        {label.name}
      </span>

      {/* 3. Trailing Tag Icon (Replaces Check Icon) */}
      {(() => {
        const labelConfig = getColorConfig(label.colorKey);
        return (
          <TagIcon
            className={`size-3.5 shrink-0 ml-auto ${labelConfig.badgeTextClass}`}
          />
        );
      })()}
    </ComboboxPrimitive.Item>
  );
}

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
  const { data: labels = [] } = useLabels({
    select: (data) => data.map((label) => ({ id: label.id, name: label.name, colorKey: label.colorKey })),
  });
  const labelsContainerRef = React.useRef<HTMLDivElement>(null);

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
                  className="text-lg md:text-xl font-semibold placeholder:text-muted-foreground/40 border-0 px-2 py-1.5 rounded-none focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent h-auto text-foreground"
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
                  className="min-h-[120px] md:min-h-[160px] text-sm text-muted-foreground placeholder:text-muted-foreground/40 border-0 px-2 py-1.5 rounded-none focus-visible:ring-0 focus-visible:outline-none shadow-none bg-transparent resize-none leading-relaxed flex-1"
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityItems.map((item) => {
                        const config =
                          priorityConfig[item.value as keyof typeof priorityConfig];
                        return (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            className="rounded-lg cursor-pointer"
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

                  <div ref={labelsContainerRef} className="w-full">
                    <Combobox
                      id="labels-combobox"
                      multiple
                      items={labels}
                      itemToStringLabel={(item: unknown) => {
                        if (typeof item === "string") {
                          return labels.find((l) => l.id === item)?.name ?? item;
                        }
                        if (item && typeof item === "object" && "name" in item) {
                          return String((item as { name: string }).name);
                        }
                        return "";
                      }}
                      filter={(item: unknown, query: string) => {
                        const name =
                          typeof item === "string"
                            ? (labels.find((l) => l.id === item)?.name ?? "")
                            : item && typeof item === "object" && "name" in item
                              ? String((item as { name: string }).name)
                              : "";
                        return name.toLowerCase().includes(query.trim().toLowerCase());
                      }}
                      value={field.value.map((label) => label.id)}
                      onValueChange={(labelIds) => {
                        field.onChange(labelIds.map((id) => ({ id })));
                      }}
                    >
                      <ComboboxInput
                        placeholder="Add labels..."
                        className="w-full text-sm [&_input]:pl-3 [&_input]:pr-2"
                      />

                      <ComboboxContent anchor={labelsContainerRef} sideOffset={6}>
                        <ComboboxEmpty className="text-sm p-2 text-muted-foreground">
                          No labels found
                        </ComboboxEmpty>

                        <ComboboxList>
                          {(label: (typeof labels)[number]) => (
                            <LabelComboboxItem
                              key={label.id}
                              label={label}
                              isSelected={field.value.some((f) => f.id === label.id)}
                            />
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  {/* Selected Label Chips outside the input */}
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {field.value.map((fieldItem) => {
                        const label = labels.find((l) => l.id === fieldItem.id);
                        if (!label) return null;
                        const labelConfig = getColorConfig(label.colorKey);
                        return (
                          <span
                            key={fieldItem.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium border ${labelConfig.badgeBgClass} ${labelConfig.badgeBorderClass} ${labelConfig.badgeTextClass} transition-colors`}
                          >
                            <TagIcon className="size-3.5 shrink-0" />
                            <span>{label.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(field.value.filter((l) => l.id !== fieldItem.id));
                              }}
                              className="ml-0.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              aria-label={`Remove ${label.name}`}
                            >
                              <XIcon className="size-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

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
                    <SelectTrigger>
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="rounded-lg">
                        No time scheduled
                      </SelectItem>
                      <SelectItem value="custom" className="rounded-lg">
                        Schedule time range
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {field.value && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-emerald-500" /> Start Time
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

                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-amber-500" /> End Time
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

            {/* Email Reminder Selector */}
            <Controller
              name="reminders"
              control={control}
              render={({ field, fieldState }) => {
                const currentReminder = field.value?.[0];
                const minuteOffset = currentReminder?.minuteOffset;
                const selectValue =
                  minuteOffset !== undefined ? String(minuteOffset) : "none";
                const currentTimeRange = watch("timeRange");
                const currentRecurrence = watch("recurrence" as any);
                const hasDueDateOrRecurrence = Boolean(
                  currentTimeRange?.start || currentRecurrence
                );

                return (
                  <Field className="space-y-1.5">
                    <FieldLabel
                      htmlFor="reminders-select"
                      className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
                    >
                      <AlarmClockIcon className="size-3.5 text-amber-500" />
                      Email Reminder
                    </FieldLabel>
                    {!hasDueDateOrRecurrence && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Set a due date or recurrence to enable email reminders.
                      </p>
                    )}
                    <Select
                      id="reminders-select"
                      disabled={!hasDueDateOrRecurrence}
                      value={hasDueDateOrRecurrence ? selectValue : "none"}
                      onValueChange={(val) => {
                        if (!val || val === "none") {
                          field.onChange([]);
                        } else {
                          const offset = parseInt(val, 10);
                          field.onChange([
                            {
                              type: "relative",
                              minuteOffset: offset,
                              channel: "email",
                            },
                          ]);
                        }
                      }}
                      items={[
                        { value: "none", label: "No reminder" },
                        { value: "0", label: "At time of task" },
                        { value: "10", label: "10 minutes before" },
                        { value: "15", label: "15 minutes before" },
                        { value: "30", label: "30 minutes before" },
                        { value: "60", label: "1 hour before" },
                        { value: "120", label: "2 hours before" },
                        { value: "1440", label: "1 day before" },
                      ]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reminder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="rounded-lg">
                          No reminder
                        </SelectItem>
                        <SelectItem value="0" className="rounded-lg">
                          At time of task
                        </SelectItem>
                        <SelectItem value="10" className="rounded-lg">
                          10 minutes before
                        </SelectItem>
                        <SelectItem value="15" className="rounded-lg">
                          15 minutes before
                        </SelectItem>
                        <SelectItem value="30" className="rounded-lg">
                          30 minutes before
                        </SelectItem>
                        <SelectItem value="60" className="rounded-lg">
                          1 hour before
                        </SelectItem>
                        <SelectItem value="120" className="rounded-lg">
                          2 hours before
                        </SelectItem>
                        <SelectItem value="1440" className="rounded-lg">
                          1 day before
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
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
        </div>
      </div>
    </form>
  );
}
