"use client";

import { lazy, Suspense } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useAuth } from "@/providers/AuthProvider";
import { useModalStore } from "@/providers/MyStoreProvider";

// Lazily load dialogs so their forms/schemas are excluded from initial bundle
const AddTaskDialog = lazy(() => import("@/features/tasks/components/add-task-dialog"));
const EditTaskDialog = lazy(() => import("@/features/tasks/components/edit-task-dialog"));
const EditProjectDialog = lazy(() => import("@/features/projects/components/edit-project-dialog"));

export function ModalProvider() {
  const { user } = useAuth();
  const activeModal = useModalStore((state) => state.activeModal);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);

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
      {activeModal.type === "edit-project" && (
        <EditProjectDialog
          key={activeModal.project.id}
          project={activeModal.project}
          onClose={closeModal}
        />
      )}
    </Suspense>
  );
}
