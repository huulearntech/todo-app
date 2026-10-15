"use client";

import { useState, useCallback } from "react";
import { TaskPriority } from "@todo/shared";
import { useLabels } from "@/features/labels/hooks/use-labels";
import type { LabelItem } from "@/features/tasks/components/task-attribute-controls/labels-popover";

const EMPTY_LABELS: LabelItem[] = [];

export interface FilterableTask {
  title: string;
  priority: TaskPriority | string;
  labels?: Array<{ id: string }>;
}

export function useTaskFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const { data: availableLabels = EMPTY_LABELS } = useLabels();

  const handleTogglePriority = useCallback((priority: TaskPriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  }, []);

  const handleToggleLabel = useCallback((label: LabelItem) => {
    setSelectedLabelIds((prev) =>
      prev.includes(label.id)
        ? prev.filter((id) => id !== label.id)
        : [...prev, label.id]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedPriorities([]);
    setSelectedLabelIds([]);
  }, []);

  const matchesFilters = useCallback(
    (item: FilterableTask) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (normalizedQuery && !item.title.toLowerCase().includes(normalizedQuery)) {
        return false;
      }
      if (
        selectedPriorities.length > 0 &&
        !selectedPriorities.includes(item.priority as TaskPriority)
      ) {
        return false;
      }
      if (selectedLabelIds.length > 0) {
        const itemLabelIds = item.labels?.map((l) => l.id) ?? [];
        const hasMatch = selectedLabelIds.some((id) => itemLabelIds.includes(id));
        if (!hasMatch) return false;
      }
      return true;
    },
    [searchQuery, selectedPriorities, selectedLabelIds]
  );

  return {
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    handleTogglePriority,
    selectedLabelIds,
    handleToggleLabel,
    handleClearFilters,
    availableLabels,
    matchesFilters,
  };
}
