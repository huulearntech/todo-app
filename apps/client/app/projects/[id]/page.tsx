import ProjectViewSwitcher from "@/features/projects/components/project-view-switcher";

// NOTE: Consider adding parameters like "year=", "month=", "week=",...
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return <ProjectViewSwitcher projectId={projectId} />;
}