import { createStore } from "zustand/vanilla";

export type AddTaskDialogState = {
  projectId?: string;
  sectionId?: string;
  dialogIsOpen: boolean;
};

export type AddTaskDialogActions = {
  setProjectId: (projectId?: string) => void;
  setSectionId: (sectionId?: string) => void;
  openDialog: (params?: { projectId?: string; sectionId?: string }) => void;
  setDialogIsOpen: (open: boolean) => void;
};

export type AddTaskDialogStore = AddTaskDialogState & AddTaskDialogActions;

export const addTaskDialogDefaultState: AddTaskDialogState = {
  projectId: undefined,
  sectionId: undefined,
  dialogIsOpen: false,
};

export const addTaskDialogStore = (initState: AddTaskDialogState = addTaskDialogDefaultState) => {
  return createStore<AddTaskDialogStore>()((set) => ({
    ...initState,
    setProjectId: (projectId?: string) => set({ projectId }),
    setSectionId: (sectionId?: string) => set({ sectionId }),
    openDialog: (params) =>
      set({
        projectId: params?.projectId,
        sectionId: params?.sectionId,
        dialogIsOpen: true,
      }),
    setDialogIsOpen: (open: boolean) => set({ dialogIsOpen: open }),
  }));
};