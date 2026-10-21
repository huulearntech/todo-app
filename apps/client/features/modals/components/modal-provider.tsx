"use client";

import { lazy, Suspense } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useAuth } from "@/providers/AuthProvider";
import { useModalStore } from "@/providers/MyStoreProvider";
import { useDeleteTask } from "@/features/tasks/hooks/use-delete-task";

// Lazily load dialogs so their forms/schemas are excluded from initial bundle
const AddTaskDialog = lazy(() => import("@/features/tasks/components/add-task-dialog"));
const EditTaskDialog = lazy(() => import("@/features/tasks/components/edit-task-dialog"));
const AddProjectDialog = lazy(() => import("@/features/projects/components/add-project-dialog"));
const EditProjectDialog = lazy(() => import("@/features/projects/components/edit-project-dialog"));
const ShareProjectDialog = lazy(() => import("@/features/projects/components/share-project-dialog"));
const DeleteTaskAlertDialog = lazy(() =>
  import("@/features/tasks/components/delete-task-alert-dialog").then((m) => ({
    default: m.DeleteTaskAlertDialog,
  }))
);

export function ModalProvider() {
  const { user } = useAuth();
  const activeModal = useModalStore((state) => state.activeModal);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const deleteTaskMutation = useDeleteTask();

  // Global hotkey: Q triggers Add Task anywhere in the app for authenticated users
  useHotkey(
    "Q",
    () => openModal({ type: "add-task" }),
    {
      enabled: Boolean(user) && !activeModal,
    }
  );

  if (!activeModal) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      {activeModal.type === "add-task" && (
        <AddTaskDialog
          projectId={activeModal.projectId}
          sectionId={activeModal.sectionId}
          onClose={closeModal}
        />
      )}
      {activeModal.type === "edit-task" && (
        <EditTaskDialog
          key={activeModal.task.id}
          task={activeModal.task}
          onClose={closeModal}
        />
      )}
      {activeModal.type === "delete-task" && (
        <DeleteTaskAlertDialog
          key={activeModal.task.id}
          task={activeModal.task}
          onClose={closeModal}
          onConfirm={(task) => {
            deleteTaskMutation.mutate(task.id);
            closeModal();
          }}
        />
      )}
      {activeModal.type === "add-project" && (
        <AddProjectDialog onClose={closeModal} />
      )}
      {activeModal.type === "edit-project" && (
        <EditProjectDialog
          key={activeModal.project.id}
          project={activeModal.project}
          onClose={closeModal}
        />
      )}
      {activeModal.type === "share-project" && (
        <ShareProjectDialog
          key={activeModal.projectId}
          projectId={activeModal.projectId}
          onClose={closeModal}
        />
      )}
    </Suspense>
  );
}
