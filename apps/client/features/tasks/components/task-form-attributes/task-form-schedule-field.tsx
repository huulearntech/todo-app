"use client";

import { Controller, type Control } from "react-hook-form";
import type { CreateTaskInput } from "@todo/shared/browser";
import { format, setHours, setMinutes } from "date-fns";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ClockIcon } from "lucide-react";

export interface TaskFormScheduleFieldProps {
  control: Control<CreateTaskInput, any, any>;
}

export function TaskFormScheduleField({ control }: TaskFormScheduleFieldProps) {
  return (
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
  );
}
