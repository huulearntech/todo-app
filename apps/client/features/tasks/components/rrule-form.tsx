"use client";

import { useEffect, useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RecurrenceFrequency,
  rruleSchema,
  type RRule,
} from "@todo/shared";

import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { RepeatIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  WEEKDAY_CONFIG,
  ORDINAL_CONFIG,
  MONTH_CONFIG,
  describeRRule,
  createDefaultRRule,
} from "@/features/tasks/utils/rrule-helpers";

import { RecurrenceIntervalSelector } from "./recurrence/recurrence-interval-selector";
import { RecurrenceWeekdayPicker } from "./recurrence/recurrence-weekday-picker";
import { RecurrencePatternPicker } from "./recurrence/recurrence-pattern-picker";
import { RecurrenceEndPicker } from "./recurrence/recurrence-end-picker";

export {
  WEEKDAY_CONFIG,
  ORDINAL_CONFIG,
  MONTH_CONFIG,
  describeRRule,
  createDefaultRRule,
};

export interface RRuleFormProps {
  value?: Partial<RRule>;
  onChange?: (rule: RRule) => void;
  onSubmit?: (rule: RRule) => void;
  onCancel?: () => void;
  className?: string;
}

export default function TempRRuleForm({
  value,
  onChange,
  onSubmit: externalOnSubmit,
  onCancel,
  className,
}: RRuleFormProps) {
  const formId = useId();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RRule>({
    resolver: zodResolver(rruleSchema),
    values: createDefaultRRule(value),
  });

  // Keep latest onChange callback in a ref to avoid effect re-subscriptions
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const subscription = watch((formValues) => {
      onChangeRef.current?.(formValues as RRule);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Single subscription to form state for reactive rendering
  const formValues = useWatch({ control });
  const { freq = RecurrenceFrequency.DAILY, interval = 1, byWeekday, byMonthDay, count, until } = formValues;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs p-5 md:p-6 space-y-6 max-w-xl",
        className
      )}
    >
      {/* Header title & summary preview */}
      <div className="space-y-1 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <RepeatIcon className="size-4" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Recurrence Rule
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {describeRRule(formValues as Partial<RRule>)}
        </p>
      </div>

      <form id={formId} onSubmit={handleSubmit((data) => externalOnSubmit?.(data))} className="space-y-5">
        <FieldGroup className="space-y-5">
          {/* Interval & Frequency Row */}
          <RecurrenceIntervalSelector
            control={control}
            setValue={setValue}
            interval={interval}
            byWeekday={byWeekday}
            formId={formId}
          />

          {/* Weekly: Weekdays Multi-select */}
          {freq === RecurrenceFrequency.WEEKLY && (
            <RecurrenceWeekdayPicker control={control} />
          )}

          {/* Monthly / Yearly Pattern & Month selection */}
          <RecurrencePatternPicker
            control={control}
            setValue={setValue}
            freq={freq}
            byWeekday={byWeekday}
            byMonthDay={byMonthDay}
            formId={formId}
          />

          {/* End Condition (Never, After, On Date) */}
          <RecurrenceEndPicker
            control={control}
            setValue={setValue}
            errors={errors}
            count={count}
            until={until}
            formId={formId}
          />
        </FieldGroup>

        {/* Form Action Buttons */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="rounded-xl h-9 text-xs font-medium px-4"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="rounded-xl h-9 text-xs font-semibold px-4 shadow-xs"
          >
            Apply Recurrence
          </Button>
        </div>
      </form>
    </div>
  );
}

export { TempRRuleForm };
