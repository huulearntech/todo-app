import ProjectContent from "./project-content";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return <ProjectContent projectId={projectId} />;
}