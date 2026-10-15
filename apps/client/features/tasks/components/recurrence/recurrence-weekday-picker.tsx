"use client";

import { Controller, type Control } from "react-hook-form";
import { Weekday, type RRule } from "@todo/shared";
import { Field, FieldLabel, FieldContent, FieldError } from "@/components/ui/field";
import { WEEKDAY_CONFIG } from "@/features/tasks/utils/rrule-helpers";
import { cn } from "@/lib/utils";

interface RecurrenceWeekdayPickerProps {
  control: Control<RRule>;
}

export function RecurrenceWeekdayPicker({ control }: RecurrenceWeekdayPickerProps) {
  return (
    <Controller
      name="byWeekday"
      control={control}
      render={({ field, fieldState }) => {
        const selectedDays = (field.value || []).map((w) => w.day);

        const toggleDay = (day: Weekday) => {
          if (selectedDays.includes(day)) {
            if (selectedDays.length === 1) return;
            field.onChange(field.value!.filter((item) => item.day !== day));
          } else {
            field.onChange([...(field.value || []), { day }]);
          }
        };

        return (
          <Field data-invalid={fieldState.invalid} className="space-y-2 pt-1">
            <FieldLabel className="text-xs font-semibold text-muted-foreground">
              Repeat on Weekdays
            </FieldLabel>
            <FieldContent>
              <div
                role="group"
                aria-label="Repeat on weekdays"
                className="flex flex-wrap gap-2"
              >
                {WEEKDAY_CONFIG.map(({ value: day, short, full }) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={`Repeat on ${full}`}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "size-9 rounded-full border text-xs font-medium transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none select-none",
                        isChecked
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold scale-105"
                          : "bg-background/80 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
