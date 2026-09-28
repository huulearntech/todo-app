import DndKanban from "@/components/(home)/dnd-kanban";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  return (
    <main className="overflow-x-hidden min-h-0 h-full min-w-0 flex flex-col">
      <DndKanban projectId={projectId}/>
    </main>
  )
}