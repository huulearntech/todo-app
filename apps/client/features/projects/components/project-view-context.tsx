"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type ProjectViewType = "kanban" | "calendar";

interface ProjectViewContextValue {
  view: ProjectViewType;
  setView: (view: ProjectViewType) => void;
}

const ProjectViewContext = createContext<ProjectViewContextValue | undefined>(
  undefined
);

export function ProjectViewProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Primary state is the URL search parameter; derive view directly during render
  const urlView = searchParams.get("view");
  const view: ProjectViewType = urlView === "calendar" ? "calendar" : "kanban";

  const setView = useCallback(
    (newView: ProjectViewType) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newView === "kanban") {
        params.delete("view");
      } else {
        params.set("view", newView);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  return (
    <ProjectViewContext.Provider value={{ view, setView }}>
      {children}
    </ProjectViewContext.Provider>
  );
}

export function useProjectView() {
  const context = useContext(ProjectViewContext);
  if (!context) {
    throw new Error(
      "useProjectView must be used within a ProjectViewProvider"
    );
  }
  return context;
}
