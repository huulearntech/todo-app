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
import { GripVerticalIcon, Plus } from 'lucide-react'

import TaskItemListView from "./task-card"

import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"

import type { TaskResponseDto as Task } from "@todo/shared"
import { sectionService } from "@/services/section.service"
import { SectionResponseDto } from "@todo/shared"

import { AddTaskFormTrigger } from "./add-task-form"

import AddSectionForm from "../../app/projects/add-section-form";
import { projectService } from "@/services/project.service"
import { Skeleton } from "../ui/skeleton"

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
    <KanbanItem value={task.id} {...props}>
      <Wrapper>
        <TaskItemListView task={task} />
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
    <KanbanColumn value={value} {...props}>
      <Card className="mb-2.5">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold">
              {title}
            </span>
            <Badge variant="outline">{tasks.length}</Badge>
          </div>
          <KanbanColumnHandle render={<Button size="icon-xs" variant="ghost" />} >
            <GripVerticalIcon />
          </KanbanColumnHandle>
        </CardHeader>
        <CardContent>
          <KanbanColumnContent value={value} className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                asHandle={!isOverlay}
                isOverlay={isOverlay}
              />
            ))}
            <AddTaskFormTrigger sectionId={value} />
          </KanbanColumnContent>
        </CardContent>
      </Card>
    </KanbanColumn>
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
    return <KanbanBoardSkeleton />
  }

  return (
    <section className="flex-1 min-h-0 min-w-0 h-full w-full overflow-auto p-4 bg-secondary custom-kanban-scroll">
      <Kanban
        className="min-w-max min-h-full flex"
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
            console.log(activeIndex, overIndex);

            const payload = {
              sectionId: movedItemId,
              prevId: newIndex > 0
                ? Object.keys(finalColumns)[newIndex - 1]
                : null,
            };
            console.log("Moving section with payload:", payload);
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
        <KanbanBoard className="min-w-max flex *:data-[slot=kanban-column]:w-80 gap-4 pb-6">
          {Object.entries(columns).map(([sectionId, tasks]) => (
            <TaskColumn
              key={sectionId}
              value={sectionId}
              title={sections?.find((s) => s.id === sectionId)?.name}
              tasks={tasks}
            />
          ))}

          <div data-slot="kanban-column">
            <AddSectionForm projectId={projectId} />
          </div>
        </KanbanBoard>
        <KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />
      </Kanban>
    </section>
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

export default dynamic(() => Promise.resolve(DndKanban), {
  ssr: false,
})