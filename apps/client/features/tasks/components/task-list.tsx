"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDueTodayTasks } from "@/features/tasks/hooks/use-due-today-tasks";
import { usePostponeTask } from "@/features/tasks/hooks/use-postpone-task";
import { useUpdateTask } from "@/features/tasks/hooks/use-update-task";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { useDroppable, type DragEndEvent } from "@dnd-kit/core";
import TaskCard from "@/features/tasks/components/task-card";
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
} from "@/components/reui/sortable";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { CalendarDaysIcon, CheckCircle2Icon, Plus } from "lucide-react";
import { useAddTaskDialogStore } from "@/providers/MyStoreProvider";
import { cn } from "@/lib/utils";
import type { TaskResponseDto as Task } from "@todo/shared";

const POSTPONE_DROP_ZONE_ID = "postpone-to-tomorrow";

/**
 * Droppable target zone at the bottom of the list where tasks can be dropped
 * to postpone their due date to tomorrow.
 * Designed to match the dimensions and border radius of a TaskCard.
 */
function PostponeDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: POSTPONE_DROP_ZONE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-dashed p-3 min-h-[52px] transition-all duration-200 select-none cursor-pointer mt-1",
        isOver
          ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-xs"
          : "border-border/60 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-7 items-center justify-center rounded-lg transition-colors shrink-0",
          isOver
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <CalendarDaysIcon className="size-3.5" />
      </div>
      <div className="flex flex-col text-left min-w-0">
        <span
          className={cn(
            "text-xs font-medium tracking-tight transition-colors truncate",
            isOver ? "text-primary font-semibold" : "text-foreground"
          )}
        >
          {isOver ? "Release to postpone to tomorrow" : "Postpone to tomorrow"}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          Drag any task here to reschedule
        </span>
      </div>
    </div>
  );
}

/**
 * Calculates the target postponed date:
 * - Postpones the date to tomorrow (next day).
 * - If the task already has a scheduled time (timeRange.start), preserves its exact time of day.
 * - If the task has no time set, postpones the date to tomorrow with default time.
 */
export function calculatePostponedDate(task: Pick<Task, "timeRange">): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (task.timeRange?.start) {
    const originalStart = new Date(task.timeRange.start);
    if (!isNaN(originalStart.getTime())) {
      tomorrow.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        originalStart.getMilliseconds()
      );
    }
  }

  return tomorrow.toISOString();
}

export default function TaskList() {
  const { data: initialTasks, isLoading } = useDueTodayTasks();
  const queryClient = useQueryClient();
  const postponeTaskMutation = usePostponeTask();
  const updateTaskMutation = useUpdateTask({ suppressToast: true });
  const openDialog = useAddTaskDialogStore((state) => state.openDialog);

  // Local state for drag-and-drop sortable items, synchronized when query results change
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [items, setItems] = useState<Task[]>(initialTasks ?? []);

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setItems(initialTasks ?? []);
  }

  /**
   * Handle drag end events:
   * 1. If dropped into the postpone section, postpone the task immediately with optimistic updates
   *    and provide a compensating Undo action via updateTaskMutation.
   * 2. If dropped within the list, Sortable's internal handler handles arrayMove.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Check if the item was dropped into the Postpone Drop Zone
    if (over.id === POSTPONE_DROP_ZONE_ID) {
      const taskId = String(active.id);
      const originalIndex = items.findIndex((t) => t.id === taskId);
      const taskToPostpone = items[originalIndex];
      if (!taskToPostpone) return;

      const tomorrowIso = calculatePostponedDate(taskToPostpone);

      // 1. Dispatch immediate optimistic mutation (updates TanStack Query cache atomically)
      postponeTaskMutation.mutate({ taskId, postponeTo: tomorrowIso });

      // 2. Optimistic UI update in local drag state so item disappears synchronously
      setItems((prev) => prev.filter((t) => t.id !== taskId));

      // 3. Show Toast with Compensating Undo Action
      const postponeToastId = toast.add({
        title: "Task postponed",
        description: `"${taskToPostpone.title}" postponed to tomorrow.`,
        type: "success",
        actionProps: {
          children: "Undo",
          onClick: () => {
            // Restore the original timeRange on the backend and in the query cache
            updateTaskMutation.mutate({
              taskId,
              data: {
                timeRange: taskToPostpone.timeRange,
              },
            });

            // Optimistically restore into today's query cache immediately
            queryClient.setQueryData<Task[]>(taskQueryKeys.dueToday(), (old) => {
              if (!old || !Array.isArray(old)) return [taskToPostpone];
              if (old.some((t) => t.id === taskId)) return old;
              const restored = [...old];
              const insertIndex =
                originalIndex >= 0 && originalIndex <= old.length
                  ? originalIndex
                  : old.length;
              restored.splice(insertIndex, 0, taskToPostpone);
              return restored;
            });

            // Restore in local sortable state
            setItems((prev) => {
              if (prev.some((t) => t.id === taskId)) return prev;
              const restored = [...prev];
              const insertIndex =
                originalIndex >= 0 && originalIndex <= prev.length
                  ? originalIndex
                  : prev.length;
              restored.splice(insertIndex, 0, taskToPostpone);
              return restored;
            });

            // Close the original "Task postponed" toast
            if (postponeToastId) {
              toast.close(postponeToastId);
            }

            toast.add({
              title: "Postpone undone",
              description: `"${taskToPostpone.title}" restored to today's list.`,
              type: "info",
            });
          },
        },
      });
    }
  };

  /**
   * Called when sortable order is committed:
   */
  const handleValueCommit = () => {
    // Persist reordering if implemented
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
            onClick={() => openDialog()}
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

        <button
          type="button"
          onClick={() => openDialog()}
          className="group flex items-center gap-2.5 w-full py-2 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors select-none text-left rounded-lg cursor-pointer"
        >
          <span className="flex size-5 items-center justify-center rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Plus className="size-4" />
          </span>
          <span className="font-medium">Add task</span>
        </button>

        {/* Droppable section at the bottom for postponing tasks to tomorrow */}
        <PostponeDropZone />
      </Sortable>
    </div>
  );
}