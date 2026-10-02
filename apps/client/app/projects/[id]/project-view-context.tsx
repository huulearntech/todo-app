"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
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

// TODO: handle search param more robustly
export function ProjectViewProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlView = searchParams.get("view");
  const initialView: ProjectViewType =
    urlView === "calendar" ? "calendar" : "kanban";
  const [view, setViewState] = useState<ProjectViewType>(initialView);

  useEffect(() => {
    if (urlView === "calendar" || urlView === "kanban") {
      setViewState(urlView);
    }
  }, [urlView]);

  const setView = (newView: ProjectViewType) => {
    setViewState(newView);
    const params = new URLSearchParams(searchParams.toString());
    if (newView === "kanban") {
      params.delete("view");
    } else {
      params.set("view", newView);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

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
