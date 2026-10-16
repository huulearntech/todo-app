import type { TaskResponseDto as Task } from "@todo/shared";
import { createStore } from "zustand/vanilla";

export type EditTaskDialogState = {
  task: Task | null;
};

export type EditTaskDialogActions = {
  setTask: (task: Task | null) => void;
};

export type EditTaskDialogStore = EditTaskDialogState & EditTaskDialogActions;

export const editTaskDialogDefaultState: EditTaskDialogState = {
  task: null,
};

export const editTaskDialogStore = (initState: EditTaskDialogState = editTaskDialogDefaultState) => {
  return createStore<EditTaskDialogStore>()((set) => ({
    ...initState,
    setTask: (task: Task | null) => set({ task }),
  }));
};