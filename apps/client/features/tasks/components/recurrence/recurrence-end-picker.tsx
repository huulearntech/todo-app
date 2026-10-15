"use client";

import { Controller, type Control, type FieldErrors, type UseFormSetValue } from "react-hook-form";
import { type RRule } from "@todo/shared";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, addMonths, endOfDay, startOfDay, isBefore } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurrenceEndPickerProps {
  control: Control<RRule>;
  setValue: UseFormSetValue<RRule>;
  errors: FieldErrors<RRule>;
  count?: number;
  until?: string;
  formId: string;
}

export function RecurrenceEndPicker({
  control,
  setValue,
  errors,
  count,
  until,
  formId,
}: RecurrenceEndPickerProps) {
  const endType: "never" | "count" | "until" = count ? "count" : until ? "until" : "never";

  return (
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
                size="sm"
                className="w-20"
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
  );
}
