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

import TaskItemListView from "./task-item__list-view.draft"

import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"

import type { Task } from "@/types/task.type"
import { sectionService } from "@/services/section.service"
import { Section } from "@/types/section.type"

import { AddTaskFormTrigger } from "./add-task-form"

import AddSectionForm from "../../app/projects/add-section-form";

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
            {/* <AddTaskDialog sectionId={value} /> */}

            <AddTaskFormTrigger sectionId={value} />
          </KanbanColumnContent>

        </CardContent>
      </Card>
    </KanbanColumn>
  )
}

function AddSectionDialogTrigger({ sectionId }: { sectionId: string }) {
  return (
    <button
      data-slot="button"
      type="button"
      onClick={() => {
        console.log("AddSectionDialogTrigger clicked", { sectionId })
      }}
      className="relative opacity-0 hover:opacity-100 transition-opacity duration-200 w-4 flex justify-center cursor-pointer">
      <span className="z-1000 whitespace-nowrap border border-muted-foreground bg-secondary rounded-full p-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Plus className="text-muted-foreground"/>
      </span>
      <div className="w-px h-full bg-muted-foreground" />
    </button>
  )
}

function DndKanban({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { projectId }],
    queryFn: () => taskService.getTasksByProjectId(projectId),
  });
  
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["sections", { projectId }],
    queryFn: () => sectionService.getSectionsByProjectId(projectId),
  });

  const isLoading = tasksLoading || sectionsLoading;

  const [columns, setColumns] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const acc: Record<string, Task[]> = {}

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
    onMutate: async ({}, context) => {
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
      await sectionService.updateSectionOrder({ id: sectionId, prevId });
    },
    onMutate: async ({ sectionId, prevId }, context) => {
      await context.client.cancelQueries({ queryKey: ["sections", { projectId }] })
      const previousSections = context.client.getQueryData<Section[]>(["sections", { projectId }])

      // NOTE: Optimistically update the UI state for immediate feedback
      context.client.setQueryData<Section[]>(
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
    return <div>Loading...</div>
  }

  return (
    <section
      className="flex flex-1 min-h-0 overflow-x-auto px-4 py-3 bg-secondary"
    >
      <Kanban
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
                title={sections.find((s) => s.id === sectionId)?.name}
                tasks={tasks}
              />
          ))}

          <div data-slot="kanban-column" className="ml-4">
            <AddSectionForm projectId={projectId} />
          </div>
        </KanbanBoard>
        <KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />
      </Kanban>
    </section>
  )
}

export default dynamic(() => Promise.resolve(DndKanban), {
  ssr: false,
})