import LabelTaskList from "@/features/labels/components/label-task-list";

export default async function LabelsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labelId } = await params;
  return (
    <div className="w-full">
      <LabelTaskList labelId={labelId} />
    </div>
  );
}