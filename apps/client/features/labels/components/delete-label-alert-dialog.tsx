"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";

export interface DeleteLabelAlertDialogProps {
  label: TaskLabel;
  onClose: () => void;
  onConfirm: (label: TaskLabel) => void;
}

export function DeleteLabelAlertDialog({
  label,
  onClose,
  onConfirm,
}: DeleteLabelAlertDialogProps) {
  const [open, setOpen] = useState(true);

  const handleDelete = () => {
    onConfirm(label);
    setOpen(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Label</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&quot;{label.name}&quot;</span>? Tasks tagged with this label will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={() => setOpen(false)} className="rounded-lg">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            className="rounded-lg"
          >
            Delete Label
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

