import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectHeader from "./project-header";
import { ProjectViewProvider } from "./project-view-context";
import { getProjectById } from "@/lib/server/api/project";

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
    title: `${project.name} | Todo`,
    description: project.description ?? undefined,
  };
}

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
    <Suspense>
      <ProjectViewProvider>
        <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden">
          <ProjectHeader projectName={project.name} />
          <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
      </ProjectViewProvider>
    </Suspense>
  );
}