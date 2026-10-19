"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { getColorConfig } from "@/lib/color-palette";
import { CheckIcon, TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LabelComboboxItemProps extends ComboboxPrimitive.Item.Props {
  label: {
    id: string;
    name: string;
    colorKey?: string | null;
  };
  isSelected: boolean;
}

export function LabelComboboxItem({
  label,
  isSelected,
  className,
  ...props
}: LabelComboboxItemProps) {
  const labelConfig = getColorConfig(label.colorKey);

  return (
    <ComboboxPrimitive.Item
      value={label.id}
      className={cn(
        "group/item relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-1.5 px-2.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* 1. Leading Checkbox */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-transparent group-hover/item:border-input/80 dark:bg-input/30"
        )}
      >
        {isSelected && <CheckIcon className="size-3.5 stroke-[2.5]" />}
      </span>

      {/* 2. Label Name in Middle */}
      <span className="flex-1 truncate font-normal text-foreground">
        {label.name}
      </span>

      {/* 3. Trailing Tag Icon */}
      <TagIcon
        className={`size-3.5 shrink-0 ml-auto ${labelConfig.badgeTextClass}`}
      />
    </ComboboxPrimitive.Item>
  );
}
