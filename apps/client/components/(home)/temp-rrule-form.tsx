// TODO: This code is too shitty. Need to rewrite it anyway
"use client";

import { useEffect, useId, useRef } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RecurrenceFrequency,
  rruleSchema,
  Weekday,
  type RRule,
} from "@todo/shared";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  format,
  parseISO,
  isValid,
  addMonths,
  endOfDay,
  startOfDay,
  isBefore,
} from "date-fns";
import { CalendarIcon, RepeatIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const WEEKDAY_CONFIG = [
  { value: Weekday.MO, short: "Mo", full: "Monday" },
  { value: Weekday.TU, short: "Tu", full: "Tuesday" },
  { value: Weekday.WE, short: "We", full: "Wednesday" },
  { value: Weekday.TH, short: "Th", full: "Thursday" },
  { value: Weekday.FR, short: "Fr", full: "Friday" },
  { value: Weekday.SA, short: "Sa", full: "Saturday" },
  { value: Weekday.SU, short: "Su", full: "Sunday" },
] as const;

export const ORDINAL_CONFIG = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
] as const;

export const MONTH_CONFIG = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export interface RRuleFormProps {
  value?: Partial<RRule>;
  onChange?: (rule: RRule) => void;
  onSubmit?: (rule: RRule) => void;
  onCancel?: () => void;
  className?: string;
}

/** Generates human-readable recurrence description */
export function describeRRule(rule: Partial<RRule>): string {
  if (!rule.freq) return "No repeat pattern defined";

  const interval = rule.interval ?? 1;
  let text = "";

  switch (rule.freq) {
    case RecurrenceFrequency.DAILY:
      text = interval === 1 ? "Every day" : `Every ${interval} days`;
      break;

    case RecurrenceFrequency.WEEKLY: {
      const every = interval === 1 ? "Every week" : `Every ${interval} weeks`;
      if (rule.byWeekday && rule.byWeekday.length > 0) {
        const dayNames = rule.byWeekday
          .map((w) => WEEKDAY_CONFIG.find((d) => d.value === w.day)?.short || w.day)
          .join(", ");
        text = `${every} on ${dayNames}`;
      } else {
        text = every;
      }
      break;
    }

    case RecurrenceFrequency.MONTHLY: {
      const every = interval === 1 ? "Every month" : `Every ${interval} months`;
      if (rule.byWeekday && rule.byWeekday.length > 0) {
        const w = rule.byWeekday[0];
        const ordLabel =
          ORDINAL_CONFIG.find((o) => o.value === w.ordinal)?.label.toLowerCase() ||
          "first";
        const dayFull =
          WEEKDAY_CONFIG.find((d) => d.value === w.day)?.full || w.day;
        text = `${every} on the ${ordLabel} ${dayFull}`;
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        text = `${every} on day ${rule.byMonthDay[0]}`;
      } else {
        text = every;
      }
      break;
    }

    case RecurrenceFrequency.YEARLY: {
      const every = interval === 1 ? "Every year" : `Every ${interval} years`;
      const monthName =
        MONTH_CONFIG.find((m) => m.value === (rule.byMonth?.[0] ?? 1))?.label ||
        "January";

      if (rule.byWeekday && rule.byWeekday.length > 0) {
        const w = rule.byWeekday[0];
        const ordLabel =
          ORDINAL_CONFIG.find((o) => o.value === w.ordinal)?.label.toLowerCase() ||
          "first";
        const dayFull =
          WEEKDAY_CONFIG.find((d) => d.value === w.day)?.full || w.day;
        text = `${every} in ${monthName} on the ${ordLabel} ${dayFull}`;
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        text = `${every} in ${monthName} on day ${rule.byMonthDay[0]}`;
      } else {
        text = `${every} in ${monthName}`;
      }
      break;
    }
  }

  if (rule.count) {
    text += `, ${rule.count} ${rule.count === 1 ? "time" : "times"}`;
  } else if (rule.until) {
    try {
      const untilDate = parseISO(rule.until);
      if (isValid(untilDate)) {
        text += `, until ${format(untilDate, "MMM d, yyyy")}`;
      }
    } catch {
      // ignore
    }
  }

  return text;
}

export function createDefaultRRule(value?: Partial<RRule>): RRule {
  return {
    freq: value?.freq ?? RecurrenceFrequency.DAILY,
    interval: value?.interval ?? 1,
    count: value?.count,
    until: value?.until,
    byWeekday: value?.byWeekday ?? [],
    byMonthDay: value?.byMonthDay,
    byMonth: value?.byMonth ?? [1],
    weekStart: value?.weekStart ?? Weekday.MO,
  };
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

  const endType: "never" | "count" | "until" = count ? "count" : until ? "until" : "never";
  const isWeekdayPattern = Boolean(byWeekday?.[0]?.ordinal !== undefined);

  const monthDay = byMonthDay?.[0] ?? 1;
  const ordinal = byWeekday?.[0]?.ordinal ?? 1;
  const ordinalDay = byWeekday?.[0]?.day ?? Weekday.MO;

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
          {/* Interval & Frequency Row: "Every [ 1 ] [ Day(s) / Week(s) ... ]" */}
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
                  value={field.value ?? 1}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    field.onChange(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                  }}
                  className="h-9 w-20 rounded-xl border-border/60 bg-background/80 text-xs font-medium"
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
                    className="h-9 w-32 rounded-xl border-border/60 bg-background/80 text-xs font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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

          {/* Weekly: Weekdays Multi-select */}
          {freq === RecurrenceFrequency.WEEKLY && (
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
          )}

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
                      className="h-9 w-48 rounded-xl border-border/60 bg-background/80 text-xs font-medium"
                    >
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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
          {(freq === RecurrenceFrequency.MONTHLY ||
            freq === RecurrenceFrequency.YEARLY) && (
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
                      <SelectTrigger className="h-8 w-20 rounded-lg border-border/60 bg-background/80 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 rounded-xl">
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
                      <SelectTrigger className="h-8 w-24 rounded-lg border-border/60 bg-background/80 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                      <SelectTrigger className="h-8 w-28 rounded-lg border-border/60 bg-background/80 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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

          {/* End Condition (Never, After, On Date) */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <span className="text-xs font-semibold text-muted-foreground block">
              Ends
            </span>

            <RadioGroup
              value={endType}
              onValueChange={(val) => {
                if (val === "never") {
                  setValue("count", undefined);
                  setValue("until", undefined);
                } else if (val === "count") {
                  setValue("until", undefined);
                  setValue("count", count ?? 10);
                } else if (val === "until") {
                  setValue("count", undefined);
                  if (!until) {
                    setValue("until", endOfDay(addMonths(new Date(), 1)).toISOString());
                  }
                }
              }}
              className="gap-3"
              aria-label="Recurrence ends condition"
            >
              {/* Option 1: Never */}
              <div className="flex items-center gap-2">
                <RadioGroupItem value="never" id={`${formId}-end-never`} />
                <Label
                  htmlFor={`${formId}-end-never`}
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  Never
                </Label>
              </div>

              {/* Option 2: After X Occurrences */}
              <div className="flex items-center gap-2">
                <RadioGroupItem value="count" id={`${formId}-end-count`} />
                <Label
                  htmlFor={`${formId}-end-count`}
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  After
                </Label>
                <Controller
                  name="count"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      disabled={endType !== "count"}
                      value={field.value ?? 10}
                      onFocus={() => {
                        if (endType !== "count") {
                          setValue("until", undefined);
                          field.onChange(field.value ?? 10);
                        }
                      }}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        field.onChange(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                      }}
                      className="h-8 w-20 rounded-lg border-border/60 bg-background/80 text-xs font-medium"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">occurrences</span>
              </div>

              {/* Option 3: On Date (Until) */}
              <div className="flex items-center gap-2 flex-wrap">
                <RadioGroupItem value="until" id={`${formId}-end-until`} />
                <Label
                  htmlFor={`${formId}-end-until`}
                  className="text-xs font-medium text-foreground cursor-pointer"
                >
                  On date
                </Label>
                <Controller
                  name="until"
                  control={control}
                  render={({ field }) => {
                    const untilDate = field.value ? parseISO(field.value) : undefined;
                    const isValidDate = untilDate && isValid(untilDate);

                    return (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              disabled={endType !== "until"}
                              onClick={() => {
                                if (endType !== "until") {
                                  setValue("count", undefined);
                                  if (!field.value) {
                                    field.onChange(endOfDay(addMonths(new Date(), 1)).toISOString());
                                  }
                                }
                              }}
                              className={cn(
                                "h-8 justify-start text-left font-normal text-xs rounded-lg px-2.5",
                                !isValidDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-1.5 size-3.5 text-muted-foreground" />
                              {isValidDate
                                ? format(untilDate, "MMM d, yyyy")
                                : "Pick end date"}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={isValidDate ? untilDate : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(endOfDay(date).toISOString());
                              }
                            }}
                            disabled={(d) => isBefore(d, startOfDay(new Date()))}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </div>
            </RadioGroup>

            {errors.until && <FieldError errors={[errors.until]} />}
            {errors.count && <FieldError errors={[errors.count]} />}
          </div>
        </FieldGroup>

        {/* Form Action Buttons */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="rounded-xl h-8 text-xs font-medium px-4"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="rounded-xl h-8 text-xs font-semibold px-4 shadow-sm"
          >
            Apply Recurrence
          </Button>
        </div>
      </form>
    </div>
  );
}

export { TempRRuleForm };
