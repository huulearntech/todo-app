import ProjectContent from "@/features/projects/components/project-content";

// NOTE: Consider adding parameters like "year=", "month=", "week=",...
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return <ProjectContent projectId={projectId} />;
}