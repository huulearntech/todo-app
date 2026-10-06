"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { ProjectResponseDto as Project } from "@todo/shared";
import EditProjectDialog from "@/app/projects/edit-project-dialog";

interface EditProjectContextType {
  projectToEdit: Project | null;
  isOpen: boolean;
  openEditProjectDialog: (project: Project) => void;
  closeEditProjectDialog: () => void;
}

const EditProjectContext = createContext<EditProjectContextType | undefined>(undefined);

export function EditProjectProvider({ children }: { children: ReactNode }) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const openEditProjectDialog = (project: Project) => {
    setProjectToEdit(project);
  };

  const closeEditProjectDialog = () => {
    setProjectToEdit(null);
  };

  return (
    <EditProjectContext.Provider
      value={{
        projectToEdit,
        isOpen: !!projectToEdit,
        openEditProjectDialog,
        closeEditProjectDialog,
      }}
    >
      {children}
      <EditProjectDialog />
    </EditProjectContext.Provider>
  );
}

export function useEditProjectDialog() {
  const context = useContext(EditProjectContext);
  if (!context) {
    throw new Error("useEditProjectDialog must be used within an EditProjectProvider");
  }
  return context;
}
