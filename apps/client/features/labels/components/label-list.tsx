"use client";

import { useState } from "react";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";
import { Badge } from "@/components/reui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TagsIcon } from "lucide-react";

import AddLabelDialog from "@/features/labels/components/add-label-dialog";
import EditLabelDialog from "@/features/labels/components/edit-label-dialog";
import { useLabels, EMPTY_LABELS } from "@/features/labels/hooks/use-labels";
import { useDeleteLabelWithUndo } from "@/features/labels/hooks/use-delete-label-with-undo";
import { LabelListItem } from "./label-list-item";
import { DeleteLabelAlertDialog } from "./delete-label-alert-dialog";

export function LabelListSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function LabelList() {
  const { data: labels = EMPTY_LABELS, isLoading } = useLabels();

  const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<TaskLabel | null>(null);

  const { deleteLabelWithUndo } = useDeleteLabelWithUndo(labels);

  if (isLoading) {
    return <LabelListSkeleton />;
  }

  return (
    <div className="section-stack w-full">
      {/* Header section */}
      <div className="page-header-row">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <TagsIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">
                Task Labels
              </h1>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {labels.length}
              </Badge>
            </div>
            <p className="page-subtitle">
              Organize and filter your tasks by custom tags.
            </p>
          </div>
        </div>
        <AddLabelDialog />
      </div>

      {/* Label List */}
      <ul className="list-stack">
        {labels.map((label) => (
          <LabelListItem
            key={label.id}
            label={label}
            onEdit={setEditingLabel}
            onDelete={setDeletingLabel}
          />
        ))}
      </ul>

      {/* Edit Label Dialog */}
      {editingLabel && (
        <EditLabelDialog
          label={editingLabel}
          onClose={() => setEditingLabel(null)}
        />
      )}

      {/* Delete Label Confirmation Dialog */}
      {deletingLabel && (
        <DeleteLabelAlertDialog
          label={deletingLabel}
          onClose={() => setDeletingLabel(null)}
          onConfirm={(label) => deleteLabelWithUndo(label)}
        />
      )}
    </div>
  );
}
