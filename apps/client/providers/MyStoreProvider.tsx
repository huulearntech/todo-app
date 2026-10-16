"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import { type ModalStore, createModalStore } from "@/features/modals/stores/modal.store";

export type MyStoreContextType = {
  modalStore: ReturnType<typeof createModalStore>;
};

export const MyStoreContext = createContext<MyStoreContextType | undefined>(undefined);

export function MyStoreProvider({ children }: { children: ReactNode }) {
  const modalStoreRef = useRef(createModalStore());

  return (
    <MyStoreContext.Provider
      value={{
        modalStore: modalStoreRef.current,
      }}
    >
      {children}
    </MyStoreContext.Provider>
  );
}

export function useModalStore<T>(selector: (state: ModalStore) => T): T {
  const store = useContext(MyStoreContext);
  if (!store) {
    throw new Error("useModalStore must be used within a MyStoreProvider");
  }
  return useStore(store.modalStore, selector);
}