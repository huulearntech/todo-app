import ProjectCompletedTasks from "@/features/projects/components/project-completed-tasks";

export default async function ProjectCompletedTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return (
    <ProjectCompletedTasks
      projectId={projectId}
      backHref={`/projects/${projectId}`}
      backLabel="Back to Board"
    />
  );
}
