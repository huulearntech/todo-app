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
  type KanbanCommitMeta,
} from "@/components/reui/kanban"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GripVerticalIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, PlusIcon } from "lucide-react"

import TaskItemListView from "./task-card"

import {
  type TaskResponseDto as Task,
  type SectionResponseDto,
  TaskPriority,
} from "@todo/shared"
import { useProjectTasks } from "@/hooks/tasks/use-project-tasks"
import { useLabels } from "@/hooks/labels/use-labels"
import { KanbanFilterBar } from "./kanban-filter-bar"
import type { LabelItem } from "./task-attribute-controls/labels-popover"
import { useSections } from "@/hooks/sections/use-sections"
import { useMoveTasks } from "@/hooks/tasks/use-move-tasks"
import { useMoveSection } from "@/hooks/sections/use-move-section"
import { useDeleteSection } from "@/hooks/sections/use-delete-section"
import { AddTaskFormTrigger } from "./add-task-form"
import AddSectionForm, { type AddSectionFormHandle } from "../../app/projects/add-section-form"
import EditSectionDialog from "../../app/projects/edit-section-dialog"
import { getColorConfig } from "@/lib/color-palette"
import { cn } from "@/lib/utils"
import { Skeleton } from "../ui/skeleton"
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

interface TaskCardProps extends Omit<
  ComponentProps<typeof KanbanItem>,
  "value" | "children"
> {
  task: Task
  asHandle?: boolean
  isOverlay?: boolean
}

// NOTE: I have tried to replace this with dummy card, the performance still sucks. So it should be in the kanban
function TaskCard({ task, asHandle, isOverlay, ...props }: TaskCardProps) {
  const Wrapper = (asHandle && !isOverlay) ? KanbanItemHandle : Fragment

  return (
    <KanbanItem value={task.id} {...props}>
      <Wrapper>
        <TaskItemListView task={task} />
        {/* <div className="w-20 h-20 border">
        </div> */}
      </Wrapper>
    </KanbanItem>
  )
}

interface TaskColumnProps extends Omit<
  ComponentProps<typeof KanbanColumn>,
  "children"
> {
  projectId: string
  tasks: Task[]
  section?: SectionResponseDto
  isOverlay?: boolean
  onEdit: (section: SectionResponseDto) => void
  onDelete: (sectionId: string) => void
}

function TaskColumn({
  projectId,
  value,
  section,
  tasks,
  isOverlay,
  onEdit,
  onDelete,
  ...props
}: TaskColumnProps) {
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const title = section?.name || "Untitled section"
  const colorConfig = getColorConfig(section?.colorKey)

  return (
    <>
      <KanbanColumn value={value} {...props}>
        <Card
          className={cn(
            "mb-2.5 transition-colors border-border/80",
            section?.colorKey && colorConfig?.badgeBgClass
          )}
        >
          <CardHeader className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="text-sm font-semibold text-foreground truncate"
                title={title}
              >
                {title}
              </span>
              <Badge variant="outline" className="shrink-0">
                {tasks.length}
              </Badge>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {/* <DropdownMenu>
                <DropdownMenuTrigger
                  render={(triggerProps) => (
                    <Button
                      {...triggerProps}
                      size="icon-xs"
                      variant="ghost"
                      className="opacity-0 group-hover/kanban-column:opacity-100 data-popup-open:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-foreground transition-opacity rounded-md"
                      aria-label={`Section options for ${title}`}
                    />
                  )}
                >
                  <MoreHorizontalIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-md">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => section && onEdit(section)}
                      className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                    >
                      <PencilIcon className="size-3.5 text-muted-foreground" />
                      <span>Edit section</span>
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
              </DropdownMenu> */}

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
              <AddTaskFormTrigger sectionId={value} projectId={projectId} />
            </KanbanColumnContent>
          </CardContent>
        </Card>
      </KanbanColumn>

      {/* <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      </AlertDialog> */}
    </>
  )
}


const EMPTY_LABELS: LabelItem[] = [];

function DndKanban({ projectId }: { projectId: string }) {
  const addSectionRef = useRef<AddSectionFormHandle>(null);
  const {
    data: projectTasks,
    isLoading: tasksLoading,
  } = useProjectTasks(projectId);
  const { data: sections, isLoading: sectionsLoading } = useSections(projectId);
  const isLoading = tasksLoading || sectionsLoading || projectTasks === undefined;

  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const { data: availableLabels = EMPTY_LABELS } = useLabels();

  const [columns, setColumns] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const acc: Record<string, Task[]> = {};
    if (!sections || !projectTasks) return;

    for (const section of sections) {
      acc[section.id] = [];
    }

    for (const task of projectTasks) {
      if (
        selectedPriorities.length > 0 &&
        !selectedPriorities.includes(task.priority)
      ) {
        continue;
      }
      if (selectedLabelIds.length > 0) {
        const hasMatch = task.labels?.some((tl) =>
          selectedLabelIds.includes(tl.id)
        );
        if (!hasMatch) continue;
      }
      (acc[task.sectionId] ??= []).push(task);
    }

    // Sync external query data & filter criteria into local draggable columns state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColumns(acc);
  }, [sections, projectTasks, selectedPriorities, selectedLabelIds]);

  const handleTogglePriority = (priority: TaskPriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const handleToggleLabel = (label: LabelItem) => {
    setSelectedLabelIds((prev) =>
      prev.includes(label.id)
        ? prev.filter((id) => id !== label.id)
        : [...prev, label.id]
    );
  };

  const handleClearFilters = () => {
    setSelectedPriorities([]);
    setSelectedLabelIds([]);
  };

  const moveTasksMutation = useMoveTasks(projectId);
  const moveSectionMutation = useMoveSection(projectId);
  const deleteSectionMutation = useDeleteSection(projectId);
  const [sectionToEdit, setSectionToEdit] = useState<SectionResponseDto | null>(null);

  const handleFloatingAddSectionClick = () => {
    addSectionRef.current?.scrollIntoView();
    addSectionRef.current?.focus();
  };

  const handleValueCommit = (finalColumns: Record<string, Task[]>, meta: KanbanCommitMeta<Task>) => {
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
  }

  if (isLoading) {
    return <KanbanBoardSkeleton />;
  }

  const totalTasksCount = projectTasks?.length ?? 0;
  const filteredTasksCount = Object.values(columns).reduce(
    (sum, colTasks) => sum + colTasks.length,
    0
  );

  return (
    <div className="relative flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col">
      <KanbanFilterBar
        totalCount={totalTasksCount}
        filteredCount={filteredTasksCount}
        selectedPriorities={selectedPriorities}
        onTogglePriority={handleTogglePriority}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={handleToggleLabel}
        availableLabels={availableLabels}
        onClearFilters={handleClearFilters}
      />

      <section className="flex-1 min-h-0 min-w-0 h-full w-full overflow-auto p-4 bg-secondary custom-kanban-scroll">
        <Kanban
          className="min-w-max min-h-full flex"
          value={columns}
          onValueChange={setColumns}
          onValueCommit={handleValueCommit}
          getItemValue={(item) => item.id}
        >
          <KanbanBoard className="min-w-max flex *:data-[slot=kanban-column]:w-80 gap-4 pb-6">
            {Object.entries(columns).map(([sectionId, tasks]) => {
              const section = sections?.find((s) => s.id === sectionId);
              return (
                <TaskColumn
                  key={sectionId}
                  projectId={projectId}
                  value={sectionId}
                  section={section}
                  tasks={tasks}
                  onEdit={(sec) => setSectionToEdit(sec)}
                  onDelete={(id) => deleteSectionMutation.mutate(id)}
                />
              );
            })}

            <div data-slot="kanban-column">
              <AddSectionForm ref={addSectionRef} projectId={projectId} />
            </div>
          </KanbanBoard>
          <KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />
        </Kanban>
      </section>

      {/* Floating Action Button */}
      {/* <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
        <Button
          type="button"
          size="lg"
          onClick={handleFloatingAddSectionClick}
          className="rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground flex items-center gap-2 px-4 h-11 transition-all active:scale-95 cursor-pointer"
          aria-label="Add new section"
        >
          <PlusIcon className="size-4.5" />
          <span className="font-semibold text-xs sm:text-sm">New Section</span>
        </Button>
      </div> */}

      {/* Edit Section Dialog */}
      <EditSectionDialog
        projectId={projectId}
        section={sectionToEdit}
        open={Boolean(sectionToEdit)}
        onOpenChange={(open) => !open && setSectionToEdit(null)}
      />
    </div>
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