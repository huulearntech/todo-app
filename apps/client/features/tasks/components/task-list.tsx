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
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, Plus } from "lucide-react";
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

  // Local state for drag-and-drop sortable items, synchronized when query results change
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [items, setItems] = useState<Task[]>(initialTasks ?? EMPTY_TASKS);

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setItems(initialTasks ?? EMPTY_TASKS);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (over.id === POSTPONE_DROP_ZONE_ID) {
      const taskId = String(active.id);
      const originalIndex = items.findIndex((t) => t.id === taskId);
      const taskToPostpone = items[originalIndex];
      if (!taskToPostpone) return;

      // Optimistic UI update in local sortable state
      setItems((prev) => prev.filter((t) => t.id !== taskId));

      postponeWithUndo(taskToPostpone, originalIndex, (restoredTask, insertIndex) => {
        setItems((prev) => {
          if (prev.some((t) => t.id === restoredTask.id)) return prev;
          const restored = [...prev];
          const idx = insertIndex >= 0 && insertIndex <= prev.length ? insertIndex : prev.length;
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
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center select-none">
          <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <CheckCircle2Icon className="size-8 stroke-[1.75]" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            All caught up for today
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 mb-6 leading-relaxed">
            Enjoy your free time, or add a task to plan ahead.
          </p>
          <Button
            type="button"
            onClick={() => openModal({ type: "add-task" })}
            className="gap-2 font-medium shadow-xs"
          >
            <Plus className="size-4" />
            Add task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <Sortable
        value={items}
        onValueChange={setItems}
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