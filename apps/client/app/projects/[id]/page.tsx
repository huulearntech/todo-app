export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Project {projectId}</h1>
      <p>Project details and tasks will be displayed here.</p>
    </div>
  )
}