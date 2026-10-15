"use client";

import { DatePickerPopover } from "./date-picker-popover";
import { PriorityMenu } from "./priority-menu";
import { LabelsPopover, type LabelItem } from "./labels-popover";
import { ReminderPopover } from "./reminder-popover";
import { TaskPriority } from "@todo/shared";

export interface TaskAttributeToolbarProps {
  timeRange?: { start: string; end: string } | null;
  dateDisplay?: string;
  onDateChange: (
    timeRange: { start: string; end: string } | null,
    displayText?: string
  ) => void;
  priority: TaskPriority;
  isPriorityExplicit: boolean;
  onPrioritySelect: (priority: TaskPriority, isExplicit: boolean) => void;
  selectedLabels: LabelItem[];
  availableLabels: LabelItem[];
  onToggleLabel: (label: LabelItem) => void;
  reminderOffset?: number | null;
  onReminderChange: (minuteOffset: number | null) => void;
}

export function TaskAttributeToolbar({
  timeRange,
  dateDisplay,
  onDateChange,
  priority,
  isPriorityExplicit,
  onPrioritySelect,
  selectedLabels,
  availableLabels,
  onToggleLabel,
  reminderOffset,
  onReminderChange,
}: TaskAttributeToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <DatePickerPopover
        value={timeRange ?? null}
        displayText={dateDisplay}
        onChange={onDateChange}
      />

      <PriorityMenu
        value={priority}
        isExplicit={isPriorityExplicit}
        onChange={onPrioritySelect}
      />

      <LabelsPopover
        selectedLabels={selectedLabels}
        availableLabels={availableLabels}
        onToggleLabel={onToggleLabel}
      />

      <ReminderPopover
        minuteOffset={reminderOffset}
        onChange={onReminderChange}
        hasDueDate={Boolean(timeRange?.start)}
      />
    </div>
  );
}
