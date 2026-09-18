import TempTaskList from "./temp-task-list";

export default async function LabelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labelId } = await params;
  return (
    <div>
      <h1>Label { labelId }</h1>
      <TempTaskList labelId={labelId} />
    </div>
  );
}