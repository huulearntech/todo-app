"use client";

import { useState } from "react";
import { useDueTodayTasks } from "@/features/tasks/hooks/use-due-today-tasks";
import { EMPTY_TASKS } from "@/features/tasks/hooks/use-project-tasks";
import type { DragEndEvent } from "@dnd-kit/core";
import TaskCard from "@/features/tasks/components/task-card";
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
} from "@/components/reui/sortable";
import { TodayTasksEmptyState } from "./today-tasks-empty-state";
import { useModalStore } from "@/providers/MyStoreProvider";
import type { TaskResponseDto as Task } from "@todo/shared";
import {
  PostponeDropZone,
  POSTPONE_DROP_ZONE_ID,
} from "./postpone-drop-zone";
import {
  calculatePostponedDate,
  usePostponeTaskWithUndo,
} from "@/features/tasks/hooks/use-postpone-task-with-undo";

export { calculatePostponedDate };

export default function TaskList() {
  const { data: initialTasks, isLoading } = useDueTodayTasks();
  const openModal = useModalStore((state) => state.openModal);
  const { postponeWithUndo } = usePostponeTaskWithUndo();

  // Transient local state for drag-and-drop sortable items; derived during render
  const [dragItems, setDragItems] = useState<Task[] | null>(null);
  const items = dragItems ?? initialTasks ?? EMPTY_TASKS;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (over.id === POSTPONE_DROP_ZONE_ID) {
      const taskId = String(active.id);
      const originalIndex = items.findIndex((t) => t.id === taskId);
      const taskToPostpone = items[originalIndex];
      if (!taskToPostpone) return;

      // Optimistic UI update in local sortable state
      setDragItems((prev) => (prev ?? items).filter((t) => t.id !== taskId));

      postponeWithUndo(taskToPostpone, originalIndex, (restoredTask, insertIndex) => {
        setDragItems((prev) => {
          const current = prev ?? items;
          if (current.some((t) => t.id === restoredTask.id)) return prev;
          const restored = [...current];
          const idx = insertIndex >= 0 && insertIndex <= current.length ? insertIndex : current.length;
          restored.splice(idx, 0, restoredTask);
          return restored;
        });
      });
    }
  };

  const handleValueCommit = () => {
    // Reorder persistence placeholder
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="h-16 rounded-xl bg-muted/60" />
        <div className="h-16 rounded-xl bg-muted/40" />
        <div className="h-16 rounded-xl bg-muted/30" />
      </div>
    );
  }

  if (items.length === 0) {
    return <TodayTasksEmptyState onAddTask={() => openModal({ type: "add-task" })} />;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <Sortable
        value={items}
        onValueChange={setDragItems}
        getItemValue={(item) => item.id}
        onDragEnd={handleDragEnd}
        onValueCommit={handleValueCommit}
        className="list-stack w-full"
      >
        {items.map((task) => (
          <SortableItem
            key={task.id}
            value={task.id}
            className="data-[dragging=true]:shadow-xl data-[dragging=true]:rounded-xl data-[dragging=true]:opacity-95"
          >
            <SortableItemHandle>
              <TaskCard task={task} />
            </SortableItemHandle>
          </SortableItem>
        ))}
      </Sortable>

      <PostponeDropZone />
    </div>
  );
}