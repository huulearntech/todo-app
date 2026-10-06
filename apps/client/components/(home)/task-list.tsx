"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { taskService } from "@/services/task.service";
import TaskCard from "@/components/(home)/task-card";
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
} from "@/components/reui/sortable";
import { toast } from "@/components/ui/toast";
import { CalendarDaysIcon, CheckCircle2Icon } from "lucide-react";
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
        "group relative flex items-center gap-3 rounded-xl border border-dashed p-2.5 min-h-[60px] transition-all duration-200 select-none cursor-pointer",
        isOver
          ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-xs"
          : "border-border/80 hover:border-primary/50 bg-card/60 hover:bg-accent/30 text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors shrink-0",
          isOver
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <CalendarDaysIcon className="size-4" />
      </div>
      <div className="flex flex-col text-left min-w-0">
        <span
          className={cn(
            "text-xs font-semibold tracking-tight transition-colors truncate",
            isOver ? "text-primary font-bold" : "text-foreground"
          )}
        >
          {isOver ? "Release to postpone to tomorrow" : "Postpone to Tomorrow"}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          Drag and drop any task here to reschedule it for tomorrow
        </span>
      </div>
    </div>
  );
}

export default function TaskList() {
  const queryClient = useQueryClient();

  const { data: initialTasks, isLoading } = useQuery({
    queryKey: ["tasks", "due-today"],
    queryFn: () => taskService.getMyTasksDueToday(),
  });

  // Local state for drag-and-drop sortable items
  const [items, setItems] = useState<Task[]>([]);

  // Synchronize local sortable state with server query results
  useEffect(() => {
    if (initialTasks === undefined) return;

    setItems(initialTasks);
  }, [initialTasks]);

  /**
   * Handle drag end events:
   * 1. If dropped into the postpone section, postpone the task to tomorrow optimistically.
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

      // 1. Optimistic UI update: Remove task from today's list
      setItems((prev) => prev.filter((t) => t.id !== taskId));

      // 2. Pending server update timeout reference (TODO: server call)
      let isUndone = false;

      const postponeTimeout = setTimeout(async () => {
        if (isUndone) return;
        // TODO: [SERVER CALL] Implement server call here to update the task's due date to tomorrow.
        // Example implementation:
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowIso = tomorrow.toISOString();
        await taskService.updateTask(taskId, {
          title: taskToPostpone.title,
          description: taskToPostpone.description,
          priority: taskToPostpone.priority,
          sectionId: taskToPostpone.sectionId,
          labels: taskToPostpone.labels,
          timeRange: {
            start: taskToPostpone.timeRange?.start ?? tomorrowIso,
            end: tomorrowIso,
          },
        });
        queryClient.invalidateQueries({ queryKey: ["tasks", "due-today"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }, 4000);

      // 3. Show Toast with Undo Action
      const postponeToastId = toast.add({
        title: "Task postponed",
        description: `"${taskToPostpone.title}" postponed to tomorrow.`,
        type: "success",
        actionProps: {
          children: "Undo",
          onClick: () => {
            isUndone = true;
            clearTimeout(postponeTimeout);

            // Restore the task back into the local state at its original index
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

            // Close the original "Task postponed" toast so user cannot click Undo again
            if (postponeToastId) {
              toast.close(postponeToastId);
            }

            toast.add({
              title: "Postpone cancelled",
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
  const handleValueCommit = (
    newItems: Task[],
    meta: {
      event: DragEndEvent;
      activeIndex: number;
      overIndex: number;
      previousValue: Task[];
    }
  ) => {
    // TODO: [SERVER CALL] Implement server call here to persist the reordered tasks.
    // Example:
    // const movedTask = newItems[meta.overIndex];
    // const prevTask = meta.overIndex > 0 ? newItems[meta.overIndex - 1] : null;
    // await taskService.updateTaskOrder({
    //   taskId: movedTask.id,
    //   sectionId: movedTask.sectionId,
    //   prevId: prevTask ? prevTask.id : null,
    // });
    // queryClient.invalidateQueries({ queryKey: ["tasks", "due-today"] });
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

  return (
    <div className="flex flex-col gap-4 w-full">
      <Sortable
        value={items}
        onValueChange={setItems}
        getItemValue={(item) => item.id}
        onDragEnd={handleDragEnd}
        onValueCommit={handleValueCommit}
        className="flex flex-col gap-2.5 w-full"
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/70 text-center bg-card/40">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
              <CheckCircle2Icon className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              All caught up for today!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No tasks due today. Enjoy your day or add a new task.
            </p>
          </div>
        ) : (
          items.map((task) => (
            <SortableItem
              key={task.id}
              value={task.id}
              className="data-[dragging=true]:shadow-xl data-[dragging=true]:rounded-xl data-[dragging=true]:opacity-95"
            >
              <SortableItemHandle>
                <TaskCard task={task} />
              </SortableItemHandle>
            </SortableItem>
          ))
        )}

        {/* Droppable section at the bottom for postponing tasks to tomorrow */}
        <PostponeDropZone />
      </Sortable>
    </div>
  );
}