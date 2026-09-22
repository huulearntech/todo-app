import { Task } from "@/types/task.type";
import { createStore } from "zustand/vanilla";

// NOTE: or just use open === !!task
export type EditTaskDialogState = {
  task: Task | null;
  dialogIsOpen: boolean;
};

export type EditTaskDialogActions = {
  setTask: (task: Task | null) => void;
  setDialogIsOpen: (open: boolean) => void;
};

export type EditTaskDialogStore = EditTaskDialogState & EditTaskDialogActions;

export const editTaskDialogDefaultState: EditTaskDialogState = {
  task: null,
  dialogIsOpen: false,
};

export const editTaskDialogStore = (initState: EditTaskDialogState = editTaskDialogDefaultState) => {
  return createStore<EditTaskDialogStore>()((set) => ({
    ...initState,
    setTask: (task: Task | null) => set({ task }),
    setDialogIsOpen: (open: boolean) => set({ dialogIsOpen: open }),
  }));
}