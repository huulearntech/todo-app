import { Suspense } from "react";
import ProjectHeader from "./project-header";
import { ProjectViewProvider } from "./project-view-context";

import type { Metadata, ResolvingMetadata } from 'next'
import { projectService } from "@/services/project.service";
 
export async function generateMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const { id } = await params;
 
  // TODO: this is not supported yet, because it need the userId which
  // lives in user browser
  // const project = await projectService.getProjectById(id);
  // if (!project) {
  //   return {
  //     title: "Project Not Found",
  //     description: "The requested project could not be found.",
  //   }
  // }

  const project = {
    name: "TODO: read this file",
    description: "TODO: read this file",
  }
 
  return {
    title: project.name,
    description: project.description,
  }
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ProjectViewProvider>
        <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden">
          <ProjectHeader />
          <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
      </ProjectViewProvider>
    </Suspense>
  );
}