import TempTaskList from "./temp-task-list";

export default async function LabelsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labelId } = await params;
  return (
    <div className="w-full">
      <TempTaskList labelId={labelId} />
    </div>
  );
}