"use client";

import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import type { CreateTaskInput } from "@todo/shared/browser";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LabelComboboxItem } from "./label-combobox-item";
import { useLabels } from "@/features/labels/hooks/use-labels";
import { getColorConfig } from "@/lib/color-palette";
import { TagIcon, XIcon } from "lucide-react";

export interface TaskFormLabelsFieldProps {
  control: Control<CreateTaskInput, any, any>;
}

export function TaskFormLabelsField({ control }: TaskFormLabelsFieldProps) {
  const { data: labels = [] } = useLabels({
    select: (data) =>
      data.map((label) => ({
        id: label.id,
        name: label.name,
        colorKey: label.colorKey,
      })),
  });
  const labelsContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <Controller
      name="labels"
      control={control}
      render={({ field, fieldState }) => (
        <Field className="space-y-1.5">
          <FieldLabel
            htmlFor="labels-combobox"
            className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
          >
            <TagIcon className="size-3.5" />
            Labels
          </FieldLabel>

          <div ref={labelsContainerRef} className="w-full">
            <Combobox
              id="labels-combobox"
              multiple
              items={labels}
              itemToStringLabel={(item: unknown) => {
                if (typeof item === "string") {
                  return labels.find((l) => l.id === item)?.name ?? item;
                }
                if (item && typeof item === "object" && "name" in item) {
                  return String((item as { name: string }).name);
                }
                return "";
              }}
              filter={(item: unknown, query: string) => {
                const name =
                  typeof item === "string"
                    ? (labels.find((l) => l.id === item)?.name ?? "")
                    : item && typeof item === "object" && "name" in item
                      ? String((item as { name: string }).name)
                      : "";
                return name.toLowerCase().includes(query.trim().toLowerCase());
              }}
              value={field.value.map((label) => label.id)}
              onValueChange={(labelIds) => {
                field.onChange(labelIds.map((id) => ({ id })));
              }}
            >
              <ComboboxInput
                placeholder="Add labels..."
                className="w-full text-sm [&_input]:pl-3 [&_input]:pr-2"
              />

              <ComboboxContent anchor={labelsContainerRef} sideOffset={6}>
                <ComboboxEmpty className="text-sm p-2 text-muted-foreground">
                  No labels found
                </ComboboxEmpty>

                <ComboboxList>
                  {(label: (typeof labels)[number]) => (
                    <LabelComboboxItem
                      key={label.id}
                      label={label}
                      isSelected={field.value.some((f) => f.id === label.id)}
                    />
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Selected Label Chips outside the input */}
          {field.value.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {field.value.map((fieldItem) => {
                const label = labels.find((l) => l.id === fieldItem.id);
                if (!label) return null;
                const labelConfig = getColorConfig(label.colorKey);
                return (
                  <span
                    key={fieldItem.id}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium border ${labelConfig.badgeBgClass} ${labelConfig.badgeBorderClass} ${labelConfig.badgeTextClass} transition-colors`}
                  >
                    <TagIcon className="size-3.5 shrink-0" />
                    <span>{label.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(
                          field.value.filter((l) => l.id !== fieldItem.id)
                        );
                      }}
                      className="ml-0.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`Remove ${label.name}`}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
