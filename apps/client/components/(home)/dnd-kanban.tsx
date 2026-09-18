// NOTE: Some serious shit happen sometimes, it rerender indefinitely, causing the page to freeze.
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
import { GripVerticalIcon } from 'lucide-react'

import TaskItemListView from "./task-item__list-view"

import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"

import type { Task } from "@/types/task.type"
import { sectionService } from "@/services/section.service"
import { Section } from "@/types/section.type"
import AddTaskDialog from "./add-task-form"

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
          </KanbanColumnContent>

          <AddTaskDialog sectionId={value} />

        </CardContent>
      </Card>
    </KanbanColumn>
  )
}

function DndKanban() {
  const projectId = "9da6157d-8d63-4470-bcdd-f2b5c9064b10" // TODO: pass as prop
  const {
    data,
    isLoading,
  } = useQuery<{
    tasks: Task[]
    sections: { id: string, name: string }[] // TODO: fix type
  }>({
    queryKey: ["tasks", "sections", { projectId }],
    queryFn: async () => {
      const [tasks, sections] = await Promise.all([
        taskService.getMyTasks_New({ projectId }),
        sectionService.getSectionsByProjectId(projectId),
      ]);

      console.log("QUERY tasks", tasks)
      console.log("QUERY sections", sections)

      return {
        tasks,
        sections,
      };
    },
  });

  const tasks = data?.tasks ?? []
  const sections = data?.sections ?? []

  const [columns, setColumns] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const acc: Record<string, Task[]> = { "no-section": [] }

    for (const section of sections) {
      acc[section.id] = []
    }

    for (const task of tasks) {
      const sectionId: string = task.section?.id ?? "no-section";
      (acc[sectionId] ??= []).push(task)
    }

    setColumns(acc)
    console.log(sections)
  }, [data])

  const moveTasksMutation = useMutation({
    mutationFn: async ({ taskId, sectionId, prevId, nextId }: {
      taskId: string;
      sectionId?: string;
      prevId?: string;
      nextId?: string;
    }) => {
      await taskService.updateTaskOrder(taskId, prevId, nextId, sectionId);
    },
    onMutate: async ({}, context) => {
      await context.client.cancelQueries({ queryKey: ["tasks", { projectId }] })
      const previousTasks = context.client.getQueryData<Task[]>(["tasks", { projectId }])

      console.log("moveTasksMutation", { previousTasks })


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
    mutationFn: async ({ sectionId, prevId, nextId }: {
      sectionId: string;
      prevId?: string;
      nextId?: string;
    }) => {
      console.log("moveSectionMutation", { sectionId, prevId, nextId })
      await sectionService.updateSectionOrder(sectionId, prevId, nextId);
    },
    onMutate: async ({ sectionId, nextId }, context) => {
      await context.client.cancelQueries({ queryKey: ["sections", { projectId }] })
      const previousSections = context.client.getQueryData<Section[]>(["sections", { projectId }])

      // NOTE: Optimistically update the UI state for immediate feedback
      context.client.setQueryData<Section[]>(
        ["sections", { projectId }],
        (oldItems = []) => {
          const newItems = [...oldItems];
          const movedItemIndex = newItems.findIndex((item) => item.id === sectionId);
          if (movedItemIndex === -1) return oldItems;

          const [movedItem] = newItems.splice(movedItemIndex, 1);
          const newIndex = nextId
            ? newItems.findIndex((item) => item.id === nextId)
            : newItems.length;

          newItems.splice(newIndex, 0, movedItem);
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
    <div
      // TODO: make it scrollable horizontally, and make the columns have a fixed width
      className="w-screen overflow-x-auto"
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
              : undefined,
            nextId: newIndex < Object.keys(finalColumns).length - 1
              ? Object.keys(finalColumns)[newIndex + 1]
              : undefined,
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
              : undefined,
            nextId: newIndex < finalColumns[targetSectionId].length - 1
              ? finalColumns[targetSectionId][newIndex + 1].id
              : undefined,
          }
          moveTasksMutation.mutate(payload);

          return;
        }
      }}
      getItemValue={(item) => item.id}
    >
      {/* <KanbanBoard className="grid auto-rows-fr grid-cols-3"> */}
      <KanbanBoard className="flex gap-2.5">
        {Object.entries(columns).map(([sectionId, tasks]) => (
          <TaskColumn
            key={sectionId}
            value={sectionId}
            title={sections.find((s) => s.id === sectionId)?.name ?? "No Section"}
            tasks={tasks}
          />
        ))}
      </KanbanBoard>
      <KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />
    </Kanban>

    </div>
  )
}

export default dynamic(() => Promise.resolve(DndKanban), {
  ssr: false,
})