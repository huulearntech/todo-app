import { createStore } from "zustand/vanilla";

export type AddTaskDialogState = {
  sectionId?: string;
  dialogIsOpen: boolean;
};

export type AddTaskDialogActions = {
  setSectionId: (sectionId: string) => void;
  setDialogIsOpen: (open: boolean) => void;
};

export type AddTaskDialogStore = AddTaskDialogState & AddTaskDialogActions;

export const addTaskDialogDefaultState: AddTaskDialogState = {
  sectionId: undefined,
  dialogIsOpen: false,
};

export const addTaskDialogStore = (initState: AddTaskDialogState = addTaskDialogDefaultState) => {
  return createStore<AddTaskDialogStore>()((set) => ({
    ...initState,
    setSectionId: (sectionId: string) => set({ sectionId }),
    setDialogIsOpen: (open: boolean) => set({ dialogIsOpen: open }),
  }));
}