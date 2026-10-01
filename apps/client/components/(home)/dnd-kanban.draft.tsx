// NOTE: The mello mezon app send the whole Object.keys(finalColumns) to the server,
// and limit the number of columns as well.
"use client"

import dynamic from "next/dynamic"
import { ComponentProps, useState, Fragment, useEffect } from "react"
import { Badge } from "@/components/reui/badge"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GripVerticalIcon, LayersIcon, SparklesIcon } from 'lucide-react'

import TaskCardInner from "./task-card"

import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"

import type { TaskResponseDto as Task } from "@todo/shared"
import { sectionService } from "@/services/section.service"
import type { SectionResponseDto } from "@todo/shared"

import { AddTaskFormTrigger } from "./add-task-form"

import AddSectionForm from "../../app/projects/add-section-form";
import { projectService } from "@/services/project.service"
import { cn } from "cn"

interface TaskCardProps extends Omit<
  ComponentProps<typeof KanbanItem>,
  "value" | "children"
> {
  task: Task
  asHandle?: boolean
  isOverlay?: boolean
}

function TaskCard({ task, asHandle, isOverlay, ...props }: TaskCardProps) {
  const Wrapper = (asHandle && !isOverlay) ? KanbanItemHandle : Fragment

  return (
    <KanbanItem
      value={task.id}
      className={cn(
        "w-full rounded-xl select-none",
        isOverlay && "scale-105 drop-shadow-xl ring-2 ring-primary/30"
      )}
      {...props}
    >
      <Wrapper>
        <TaskCardInner task={task} />
      </Wrapper>
    </KanbanItem>
  )
}

interface TaskColumnProps extends Omit<
  ComponentProps<typeof KanbanColumn>,
  "children"
> {
  tasks: Task[]
  isOverlay?: boolean
}

function TaskColumn({ value, title, tasks, isOverlay, ...props }: TaskColumnProps) {
  return (
    <KanbanColumn
      value={value}
      className={cn(
        "w-80 shrink-0 flex flex-col max-h-[82vh] border border-border/70 bg-muted/50 dark:bg-muted/30 text-card-foreground shadow-xs rounded-xl overflow-hidden",
        isOverlay && "shadow-2xl ring-2 ring-primary/20 scale-[1.01]"
      )}
      {...props}
    >
      <div className="flex flex-row items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50 gap-2 space-y-0 min-h-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-primary/70 shrink-0" />
          <span className="text-sm font-semibold truncate text-foreground tracking-tight">
            {title || "Untitled Section"}
          </span>
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-xs font-semibold rounded-full bg-background/80 text-muted-foreground shrink-0 border border-border/40"
          >
            {tasks.length}
          </Badge>
        </div>
        <KanbanColumnHandle
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            />
          }
        >
          <GripVerticalIcon className="size-3.5" />
        </KanbanColumnHandle>
      </div>

      <div className="p-2 flex-1 flex flex-col min-h-0 overflow-hidden">
        <KanbanColumnContent
          value={value}
          className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 custom-kanban-scroll flex-1 min-h-[60px]"
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 px-3 text-center rounded-lg border border-dashed border-border/60 bg-background/40 text-muted-foreground/70 my-auto">
              <LayersIcon className="size-4 stroke-[1.5] mb-1 opacity-50" />
              <p className="text-xs font-medium">No tasks in this section</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Drag tasks or create new ones</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                asHandle={!isOverlay}
                isOverlay={isOverlay}
              />
            ))
          )}
        </KanbanColumnContent>
        <div className="pt-1.5 mt-auto shrink-0">
          <AddTaskFormTrigger sectionId={value} />
        </div>
      </div>
    </KanbanColumn>
  )
}


function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3].map((index) => (
        <Card key={index} className="w-80 shrink-0 border border-border/60 bg-card/70 rounded-2xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function DndKanban({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { projectId }],
    queryFn: () => taskService.getTasksByProjectId(projectId),
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["sections", { projectId }],
    queryFn: () => projectService.getSectionsByProjectId(projectId),
  });

  const isLoading = tasksLoading || sectionsLoading;

  const [columns, setColumns] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const acc: Record<string, Task[]> = {}
    if (!sections || !tasks) return;

    for (const section of sections) {
      acc[section.id] = []
    }

    for (const task of tasks) {
      (acc[task.sectionId] ??= []).push(task)
    }

    setColumns(acc)
  }, [sections, tasks])

  const moveTasksMutation = useMutation({
    mutationFn: async ({ taskId, sectionId, prevId }: {
      taskId: string;
      sectionId: string;
      prevId: string | null;
    }) => {
      await taskService.updateTaskOrder({ taskId, prevId, sectionId });
    },
    onMutate: async ({ }, context) => {
      await context.client.cancelQueries({ queryKey: ["tasks", { projectId }] })
      const previousTasks = context.client.getQueryData<Task[]>(["tasks", { projectId }])
      return { previousTasks }
    },
    onError: (_error, _nextColumns, onMutateResult, context) => {
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData(["tasks", { projectId }], onMutateResult.previousTasks)
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["tasks", { projectId }] })
    },
  })

  const moveSectionMutation = useMutation({
    mutationFn: async ({ sectionId, prevId }: {
      sectionId: string;
      prevId: string | null;
    }) => {
      await sectionService.updateSectionOrder({ sectionId, prevId });
    },
    onMutate: async ({ sectionId, prevId }, context) => {
      await context.client.cancelQueries({ queryKey: ["sections", { projectId }] })
      const previousSections = context.client.getQueryData<SectionResponseDto[]>(["sections", { projectId }])

      // NOTE: Optimistically update the UI state for immediate feedback
      context.client.setQueryData<SectionResponseDto[]>(
        ["sections", { projectId }],
        (oldItems = []) => {
          const sectionToMove = oldItems.find((s) => s.id === sectionId);
          if (!sectionToMove) return oldItems;

          const newItems = oldItems.filter((s) => s.id !== sectionId);

          const prevIndex = prevId ? newItems.findIndex((s) => s.id === prevId) : -1;
          const newIndex = prevIndex + 1;

          newItems.splice(newIndex, 0, sectionToMove);

          return newItems;
        }
      );

      return { previousSections }
    },
    onError: (_err, _payload, onMutateResult, context) => {
      if (onMutateResult?.previousSections) {
        context.client.setQueryData(
          ["sections", { projectId }],
          onMutateResult.previousSections
        )
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["sections", { projectId }] })
    },
  })

  if (isLoading) {
    return (
      <section className="flex flex-1 overflow-x-auto p-3 bg-secondary/30 min-h-[calc(100vh-3.5rem)] rounded-2xl border border-border/40 custom-kanban-scroll">
        <KanbanBoardSkeleton />
      </section>
    )
  }

  return (
    <section className="flex flex-1 overflow-x-auto p-3 bg-secondary/30 min-h-[calc(100vh-3.5rem)] rounded-2xl border border-border/40 custom-kanban-scroll">
      <Kanban
        className="flex h-full min-w-max"
        value={columns}
        onValueChange={setColumns}
        onValueCommit={(finalColumns, meta) => {
          if (meta.kind == "column") { // Move section
            const {
              activeContainer: movedItemId,
              activeIndex,
              overIndex
            } = meta;
            if (activeIndex === overIndex) return;

            const newIndex = overIndex;

            const payload = {
              sectionId: movedItemId,
              prevId: newIndex > 0
                ? Object.keys(finalColumns)[newIndex - 1]
                : null,
            };
            moveSectionMutation.mutate(payload);

            return;
          }

          { // Move task
            const newIndex = meta.overIndex;
            const targetSectionId = meta.overContainer;

            const payload = {
              sectionId: targetSectionId,
              taskId: meta.event.active.id.toString(),
              prevId: newIndex > 0
                ? finalColumns[targetSectionId][newIndex - 1].id
                : null,
            }
            moveTasksMutation.mutate(payload);

            return;
          }
        }}
        getItemValue={(item) => item.id}
      >
        <KanbanBoard className="min-w-max flex *:data-[slot=kanban-column]:w-80 gap-4">
          {Object.entries(columns).map(([sectionId, tasks]) => (
            <TaskColumn
              key={sectionId}
              value={sectionId}
              title={sections?.find((s) => s.id === sectionId)?.name}
              tasks={tasks}
            />
          ))}

          <div data-slot="kanban-column" className="w-80 shrink-0">
            <AddSectionForm projectId={projectId} />
          </div>
        </KanbanBoard>
        <KanbanOverlay className="z-50 cursor-grabbing drop-shadow-2xl">
          {/* {({ value, variant }) => {
            if (variant === "column") {
              const section = sections?.find((s) => s.id === value)
              return (
                <TaskColumn
                  value={String(value)}
                  title={section?.name}
                  tasks={columns[String(value)] || []}
                  isOverlay
                />
              )
            }

            const task = tasks?.find((t) => t.id === value)
            if (!task) return null
            return <TaskCard task={task} isOverlay />
          }} */}
        </KanbanOverlay>
      </Kanban>
    </section>
  )
}

export default dynamic(() => Promise.resolve(DndKanban), {
  ssr: false,
})