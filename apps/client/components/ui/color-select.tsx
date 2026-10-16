"use client";

import * as React from "react";
import { useColors, EMPTY_COLORS } from "@/hooks/colors/use-colors";
import { getColorConfig } from "@/lib/color-palette";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ColorSelectProps {
  id?: string;
  value?: string | null;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  showHex?: boolean;
}

export function ColorSelect({
  id,
  value,
  onValueChange,
  disabled = false,
  className,
  triggerClassName,
  placeholder = "Select color",
  showHex = true,
}: ColorSelectProps) {
  const { data: colors = EMPTY_COLORS } = useColors();
  const selectedColor = colors.find((c) => c.key === value);
  const selectedConfig = getColorConfig(value);

  return (
    <Select
      id={id}
      value={value ?? undefined}
      onValueChange={(val) => {
        if (val && onValueChange) {
          onValueChange(val);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn(className, triggerClassName)}>
        <div className="flex items-center gap-2 w-full">
          <span
            className={cn(
              "size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10",
              selectedConfig.dotClass
            )}
          />
          <span>{selectedColor?.name || selectedConfig.label || placeholder}</span>
          {showHex && value && (
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              {value}
            </span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {colors.map((color) => {
          const config = getColorConfig(color.key);
          return (
            <SelectItem
              key={color.key}
              value={color.key}
              className="rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <span
                  className={cn(
                    "size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10",
                    config.dotClass
                  )}
                />
                <span>{color.name}</span>
                {showHex && (
                  <span className="text-xs text-muted-foreground ml-auto font-mono">
                    {color.key}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
