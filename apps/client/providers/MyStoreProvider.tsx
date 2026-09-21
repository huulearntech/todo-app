"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import { type AddTaskDialogStore, addTaskDialogStore } from "@/stores/add-task-dialog.store";
import { type EditTaskDialogStore, editTaskDialogStore } from "@/stores/edit-task-dialog.store";

export type MyStoreContextType = {
  addTaskDialogStore: ReturnType<typeof addTaskDialogStore>;
  editTaskDialogStore: ReturnType<typeof editTaskDialogStore>;
}

export const MyStoreContext = createContext<MyStoreContextType | undefined>(undefined);


export function MyStoreProvider({ children }: { children: ReactNode }) {
  const addTaskRef = useRef(addTaskDialogStore());
  const editTaskRef = useRef(editTaskDialogStore());

  return (
    <MyStoreContext.Provider value={{
      addTaskDialogStore: addTaskRef.current,
      editTaskDialogStore: editTaskRef.current,
    }}>
      {children}
    </MyStoreContext.Provider>
  );
}

export function useAddTaskDialogStore<T,>(selector: (state: AddTaskDialogStore) => T): T {
  const store = useContext(MyStoreContext);
  if (!store) {
    throw new Error("useAddTaskDialogStore must be used within a AddTaskDialogStoreProvider");
  }
  return useStore(store.addTaskDialogStore, selector);
}

export function useEditTaskDialogStore<T,>(selector: (state: EditTaskDialogStore) => T): T {
  const store = useContext(MyStoreContext);
  if (!store) {
    throw new Error("useEditTaskDialogStore must be used within a AddTaskDialogStoreProvider");
  }
  return useStore(store.editTaskDialogStore, selector);
}