import DndKanban from "@/components/(home)/dnd-kanban";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  return (
    <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
      <DndKanban projectId={projectId}/>
    </main>
  )
}