"use client";

import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { RecurrenceFrequency, Weekday, type RRule } from "@todo/shared";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MONTH_CONFIG,
  ORDINAL_CONFIG,
  WEEKDAY_CONFIG,
} from "@/features/tasks/utils/rrule-helpers";

interface RecurrencePatternPickerProps {
  control: Control<RRule>;
  setValue: UseFormSetValue<RRule>;
  freq: RecurrenceFrequency;
  byWeekday?: Array<{ day?: Weekday; ordinal?: number }>;
  byMonthDay?: number[];
  formId: string;
}

export function RecurrencePatternPicker({
  control,
  setValue,
  freq,
  byWeekday,
  byMonthDay,
  formId,
}: RecurrencePatternPickerProps) {
  const isWeekdayPattern = Boolean(byWeekday?.[0]?.ordinal !== undefined);
  const monthDay = byMonthDay?.[0] ?? 1;
  const ordinal = byWeekday?.[0]?.ordinal ?? 1;
  const ordinalDay = byWeekday?.[0]?.day ?? Weekday.MO;

  return (
    <>
      {/* Yearly Month Selector */}
      {freq === RecurrenceFrequency.YEARLY && (
        <Controller
          name="byMonth"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1.5 pt-1">
              <FieldLabel
                htmlFor={`${formId}-month`}
                className="text-xs font-semibold text-muted-foreground"
              >
                In Month
              </FieldLabel>
              <Select
                value={String(field.value?.[0] ?? 1)}
                onValueChange={(val) => val && field.onChange([parseInt(val, 10)])}
              >
                <SelectTrigger
                  id={`${formId}-month`}
                  size="sm"
                  className="w-48"
                >
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_CONFIG.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      {/* Monthly / Yearly Pattern (On Day vs On The Ordinal Day) */}
      {(freq === RecurrenceFrequency.MONTHLY || freq === RecurrenceFrequency.YEARLY) && (
        <div className="space-y-3 pt-1">
          <span className="text-xs font-semibold text-muted-foreground block">
            Repeat Pattern
          </span>

          <RadioGroup
            value={isWeekdayPattern ? "weekday" : "monthday"}
            onValueChange={(pattern) => {
              if (pattern === "monthday") {
                setValue("byMonthDay", [monthDay]);
                setValue("byWeekday", undefined);
              } else {
                setValue("byWeekday", [{ day: ordinalDay, ordinal }]);
                setValue("byMonthDay", undefined);
              }
            }}
            className="gap-3"
            aria-label="Recurrence monthly pattern"
          >
            {/* Pattern A: On day X */}
            <div className="flex items-center gap-2">
              <RadioGroupItem value="monthday" id={`${formId}-pattern-monthday`} />
              <Label
                htmlFor={`${formId}-pattern-monthday`}
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                On day
              </Label>
              <Select
                value={String(monthDay)}
                disabled={isWeekdayPattern}
                onValueChange={(val) => val && setValue("byMonthDay", [parseInt(val, 10)])}
              >
                <SelectTrigger size="sm" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pattern B: On the [Ordinal] [Weekday] */}
            <div className="flex items-center gap-2 flex-wrap">
              <RadioGroupItem value="weekday" id={`${formId}-pattern-weekday`} />
              <Label
                htmlFor={`${formId}-pattern-weekday`}
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                On the
              </Label>
              <Select
                value={String(ordinal)}
                disabled={!isWeekdayPattern}
                onValueChange={(val) =>
                  val && setValue("byWeekday", [{ day: ordinalDay, ordinal: parseInt(val, 10) }])
                }
              >
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDINAL_CONFIG.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ordinalDay}
                disabled={!isWeekdayPattern}
                onValueChange={(val) =>
                  setValue("byWeekday", [{ day: val as Weekday, ordinal }])
                }
              >
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_CONFIG.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">
                      {d.full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </RadioGroup>
        </div>
      )}
    </>
  );
}
