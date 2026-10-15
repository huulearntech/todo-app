"use client";

import { useState, useMemo, useRef } from "react";
import {
  Kanban,
  KanbanBoard,
  KanbanOverlay,
  type KanbanCommitMeta,
} from "@/components/reui/kanban";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

import {
  type TaskResponseDto as Task,
  type SectionResponseDto,
} from "@todo/shared";
import { useProjectTasks } from "@/features/tasks/hooks/use-project-tasks";
import { KanbanFilterBar } from "./kanban-filter-bar";
import { useSections } from "@/features/projects/hooks/use-sections";
import { useMoveTasks } from "@/features/tasks/hooks/use-move-tasks";
import { useMoveSection } from "@/features/projects/hooks/use-move-section";
import { useDeleteSection } from "@/features/projects/hooks/use-delete-section";
import { useAuth } from "@/providers/AuthProvider";
import AddSectionForm, { type AddSectionFormHandle } from "@/features/projects/components/add-section-form";
import EditSectionDialog from "@/features/projects/components/edit-section-dialog";
import { DeleteSectionDialog } from "@/features/projects/components/delete-section-dialog";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";
import { groupBySection } from "@/features/tasks/utils/kanban-helpers";
import { TaskColumn } from "./kanban/kanban-column";
import { KanbanBoardSkeleton } from "./kanban/kanban-board-skeleton";

function DndKanban({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const isInbox = user?.defaultProjectId === projectId;
  const completedHref = isInbox ? "/inbox/completed" : `/projects/${projectId}/completed`;

  const addSectionRef = useRef<AddSectionFormHandle>(null);
  const {
    data: projectTasks,
    isLoading: tasksLoading,
    isError: isTasksError,
    refetch: refetchTasks,
  } = useProjectTasks(projectId);
  const {
    data: sections,
    isLoading: sectionsLoading,
    isError: isSectionsError,
    refetch: refetchSections,
  } = useSections(projectId);
  const isLoading = tasksLoading || sectionsLoading;

  const {
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    handleTogglePriority,
    selectedLabelIds,
    handleToggleLabel,
    handleClearFilters,
    availableLabels,
    matchesFilters,
  } = useTaskFilters();

  const serverColumns = useMemo(
    () => groupBySection(sections, projectTasks, matchesFilters),
    [sections, projectTasks, matchesFilters]
  );
  const [dragColumns, setDragColumns] = useState<Record<string, Task[]> | null>(null);
  const columns: Record<string, Task[]> = dragColumns ?? serverColumns;

  const moveTasksMutation = useMoveTasks(projectId);
  const moveSectionMutation = useMoveSection(projectId);
  const deleteSectionMutation = useDeleteSection(projectId);
  const [sectionToEdit, setSectionToEdit] = useState<SectionResponseDto | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<SectionResponseDto | null>(null);

  const handleFloatingAddSectionClick = () => {
    addSectionRef.current?.scrollIntoView();
    addSectionRef.current?.focus();
  };

  const handleValueCommit = (
    finalColumns: Record<string, Task[]>,
    meta: KanbanCommitMeta<Task>
  ) => {
    setDragColumns(finalColumns);

    if (meta.kind === "column") {
      const { activeContainer: movedItemId, activeIndex, overIndex } = meta;
      if (activeIndex === overIndex) {
        setDragColumns(null);
        return;
      }

      const newIndex = overIndex;
      const payload = {
        sectionId: movedItemId,
        prevId: newIndex > 0 ? Object.keys(finalColumns)[newIndex - 1] : null,
      };
      moveSectionMutation.mutate(payload, {
        onSettled: () => setDragColumns(null),
      });

      return;
    }

    const newIndex = meta.overIndex;
    const targetSectionId = meta.overContainer;

    const payload = {
      sectionId: targetSectionId,
      taskId: meta.event.active.id.toString(),
      prevId: newIndex > 0 ? finalColumns[targetSectionId][newIndex - 1].id : null,
    };
    moveTasksMutation.mutate(payload, {
      onSettled: () => setDragColumns(null),
    });
  };

  if (isTasksError || isSectionsError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]">
        <div className="text-destructive font-semibold mb-2 text-lg">
          Failed to load board data
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          An error occurred while loading tasks or sections.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isTasksError) refetchTasks();
            if (isSectionsError) refetchSections();
          }}
        >
          Try Again
        </Button>
      </div>
    );
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={totalTasksCount}
        filteredCount={filteredTasksCount}
        selectedPriorities={selectedPriorities}
        onTogglePriority={handleTogglePriority}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={handleToggleLabel}
        availableLabels={availableLabels}
        onClearFilters={handleClearFilters}
        completedHref={completedHref}
      />

      <section className="flex-1 min-h-0 min-w-0 h-full w-full overflow-auto p-4 bg-secondary custom-kanban-scroll">
        <Kanban
          id="kanban-board"
          className="min-w-max min-h-full flex"
          value={columns}
          onValueChange={setDragColumns}
          onValueCommit={handleValueCommit}
          onDragCancel={() => setDragColumns(null)}
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
                  onDelete={(sec) => setSectionToDelete(sec)}
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
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
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
      </div>

      {/* Edit Section Dialog */}
      <EditSectionDialog
        projectId={projectId}
        section={sectionToEdit}
        open={Boolean(sectionToEdit)}
        onOpenChange={(open) => !open && setSectionToEdit(null)}
      />

      {/* Delete Section Dialog */}
      <DeleteSectionDialog
        section={sectionToDelete}
        open={Boolean(sectionToDelete)}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        onConfirm={(sec) => deleteSectionMutation.mutate(sec.id)}
      />
    </div>
  );
}

export default DndKanban;