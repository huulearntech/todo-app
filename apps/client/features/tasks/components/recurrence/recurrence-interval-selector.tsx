"use client";

import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { RecurrenceFrequency, Weekday, type RRule } from "@todo/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurrenceIntervalSelectorProps {
  control: Control<RRule>;
  setValue: UseFormSetValue<RRule>;
  interval: number;
  byWeekday?: Array<{ day?: Weekday; ordinal?: number }>;
  formId: string;
}

export function RecurrenceIntervalSelector({
  control,
  setValue,
  interval,
  byWeekday,
  formId,
}: RecurrenceIntervalSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">Every</span>
      <Controller
        name="interval"
        control={control}
        render={({ field }) => (
          <Input
            id={`${formId}-interval`}
            type="number"
            min={1}
            max={53}
            size="sm"
            value={field.value ?? 1}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              field.onChange(isNaN(parsed) || parsed < 1 ? 1 : parsed);
            }}
            className="w-20"
          />
        )}
      />
      <Controller
        name="freq"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(val) => {
              const newFreq = val as RecurrenceFrequency;
              field.onChange(newFreq);
              if (newFreq === RecurrenceFrequency.WEEKLY && !byWeekday?.length) {
                setValue("byWeekday", [{ day: Weekday.MO }]);
              }
            }}
          >
            <SelectTrigger
              id={`${formId}-frequency`}
              size="sm"
              className="w-32"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RecurrenceFrequency.DAILY} className="text-xs">
                {interval > 1 ? "days" : "day"}
              </SelectItem>
              <SelectItem value={RecurrenceFrequency.WEEKLY} className="text-xs">
                {interval > 1 ? "weeks" : "week"}
              </SelectItem>
              <SelectItem value={RecurrenceFrequency.MONTHLY} className="text-xs">
                {interval > 1 ? "months" : "month"}
              </SelectItem>
              <SelectItem value={RecurrenceFrequency.YEARLY} className="text-xs">
                {interval > 1 ? "years" : "year"}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
