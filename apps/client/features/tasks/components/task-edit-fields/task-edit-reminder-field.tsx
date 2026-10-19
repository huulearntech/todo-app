"use client";

import { Controller, type Control, type UseFormWatch } from "react-hook-form";
import type { CreateTaskInput } from "@todo/shared/browser";
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
  FieldLabel,
} from "@/components/ui/field";
import { AlarmClockIcon } from "lucide-react";

export interface TaskEditReminderFieldProps {
  control: Control<CreateTaskInput, any, any>;
  watch: UseFormWatch<any>;
}

export function TaskEditReminderField({
  control,
  watch,
}: TaskEditReminderFieldProps) {
  return (
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
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
