// NOTE: The mello mezon app send the whole Object.keys(finalColumns) to the server,
// and limit the number of columns as well.
"use client"

import dynamic from "next/dynamic"
import { ComponentProps, useState, Fragment, useEffect, useRef } from "react"
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
import { GripVerticalIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"

import TaskItemListView from "./task-card"

import type { TaskResponseDto as Task } from "@todo/shared"
import { useProjectTasks } from "@/hooks/tasks/use-project-tasks"
import { useSections } from "@/hooks/sections/use-sections"
import { useMoveTasks } from "@/hooks/tasks/use-move-tasks"
import { useMoveSection } from "@/hooks/sections/use-move-section"
import { useRenameSection } from "@/hooks/sections/use-rename-section"
import { useDeleteSection } from "@/hooks/sections/use-delete-section"
import { AddTaskFormTrigger } from "./add-task-form"
import AddSectionForm from "../../app/projects/add-section-form"
import { Skeleton } from "../ui/skeleton"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { toast } from "../ui/toast"

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
  onRename: (sectionId: string, newName: string) => void
  onDelete: (sectionId: string) => void
  isRenaming?: boolean
}

function TaskColumn({
  value,
  title,
  tasks,
  isOverlay,
  onRename,
  onDelete,
  isRenaming,
  ...props
}: TaskColumnProps) {
  const [editingName, setEditingName] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = editingName !== null

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editingName === null) return
    const trimmed = editingName.trim()
    if (trimmed && trimmed !== title) {
      onRename(value, trimmed)
    }
    setEditingName(null)
  }

  const handleCancel = () => {
    setEditingName(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <>
      <KanbanColumn value={value} {...props}>
        <Card className="mb-2.5">
          <CardHeader className="flex items-center justify-between gap-2">
            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
                className="flex-1 min-w-0"
              >
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  disabled={isRenaming}
                  className="h-7 px-2 py-0 text-sm font-semibold rounded-md bg-background border-primary/50 shadow-xs focus-visible:ring-1 focus-visible:ring-primary w-full"
                  maxLength={100}
                  aria-label="Section name"
                />
              </form>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setEditingName(title ?? "")}
                  className="text-sm font-semibold text-foreground truncate rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-muted/70 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[190px]"
                  title="Click to rename section"
                  aria-label={`Rename section ${title ?? ""}`}
                >
                  {title || "Untitled section"}
                </button>
                <Badge variant="outline" className="shrink-0">{tasks.length}</Badge>
              </div>
            )}

            <div className="flex items-center gap-0.5 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={(triggerProps) => (
                    <Button
                      {...triggerProps}
                      size="icon-xs"
                      variant="ghost"
                      className="opacity-0 group-hover/kanban-column:opacity-100 data-popup-open:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-foreground transition-opacity rounded-md"
                      aria-label={`Section options for ${title ?? "section"}`}
                    />
                  )}
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-md">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => setEditingName(title ?? "")}
                      className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                    >
                      <PencilIcon className="size-3.5 text-muted-foreground" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-border/50" />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                    >
                      <Trash2Icon className="size-3.5" />
                      <span>Delete section</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <KanbanColumnHandle render={<Button size="icon-xs" variant="ghost" className="rounded-md" />} >
                <GripVerticalIcon className="size-4" />
              </KanbanColumnHandle>
            </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{title}&rdquo;?
              {tasks.length > 0 && (
                <span className="block mt-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  This section contains {tasks.length} {tasks.length === 1 ? "task" : "tasks"}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-lg"
              onClick={() => {
                onDelete(value)
                setIsDeleteDialogOpen(false)
              }}
            >
              Delete section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


function DndKanban({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const { data: sections, isLoading: sectionsLoading } = useSections(projectId);
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

  const moveTasksMutation = useMoveTasks(projectId);
  const moveSectionMutation = useMoveSection(projectId);
  const renameSectionMutation = useRenameSection(projectId);
  const deleteSectionMutation = useDeleteSection(projectId);

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
              onRename={(id, name) => renameSectionMutation.mutate({ sectionId: id, name })}
              onDelete={(id) => deleteSectionMutation.mutate(id)}
              isRenaming={renameSectionMutation.isPending}
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