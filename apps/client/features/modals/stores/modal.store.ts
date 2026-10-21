import { createStore } from "zustand/vanilla";
import type { TaskResponseDto as Task, ProjectResponseDto as Project } from "@todo/shared";

/**
 * Mutually exclusive modal configurations.
 * Every variant guarantees non-nullable required domain entities.
 */
export type ActiveModal =
  | { type: "add-task"; projectId?: string; sectionId?: string }
  | { type: "edit-task"; task: Task }
  | { type: "delete-task"; task: { id: string; title: string } }
  | { type: "add-project" }
  | { type: "edit-project"; project: Project }
  | { type: "share-project"; projectId: string };

export type ModalStore = {
  activeModal: ActiveModal | null;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
};

export const createModalStore = (initialModal: ActiveModal | null = null) => {
  return createStore<ModalStore>()((set) => ({
    activeModal: initialModal,
    openModal: (activeModal) => set({ activeModal }),
    closeModal: () => set({ activeModal: null }),
  }));
};
