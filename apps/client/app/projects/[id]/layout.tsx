import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectHeader from "@/features/projects/components/project-header";
import { ProjectViewProvider } from "@/features/projects/components/project-view-context";
import { getProjectById } from "@/features/projects/server/project";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project could not be found.",
    };
  }

  return {
    title: `${project.name}`,
    description: project.description ?? undefined,
  };
}

import { FullSpaceLayout } from "@/components/layout/full-space-layout";
import { KanbanBoardSkeleton } from "@/features/tasks/components/kanban/kanban-board-skeleton";
import { ProjectAbilityProvider } from "@/features/projects/permissions";

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <ProjectAbilityProvider role={project.role}>
        <ProjectViewProvider>
          <FullSpaceLayout
            header={
              <ProjectHeader
                projectName={project.name}
                projectId={project.id}
              />
            }
          >
            {children}
          </FullSpaceLayout>
        </ProjectViewProvider>
      </ProjectAbilityProvider>
    </Suspense>
  );
}