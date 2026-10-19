"use client";

import { Controller, type Control } from "react-hook-form";
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
import { priorityItems } from "@/lib/constants";
import { priorityConfig } from "@/features/tasks/constants/priority";
import { FlagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskEditPriorityFieldProps {
  control: Control<CreateTaskInput, any, any>;
}

export function TaskEditPriorityField({ control }: TaskEditPriorityFieldProps) {
  return (
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
  );
}
