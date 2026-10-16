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

export interface DeleteTaskAlertDialogProps {
  task: { id: string; title: string };
  onClose: () => void;
  onConfirm: (task: { id: string; title: string }) => void;
}

export function DeleteTaskAlertDialog({
  task,
  onClose,
  onConfirm,
}: DeleteTaskAlertDialogProps) {
  const [open, setOpen] = useState(true);

  const handleDelete = () => {
    onConfirm(task);
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
          <AlertDialogTitle>Delete Task Permanently</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete &ldquo;
            {task.title}&rdquo;?
            This action cannot be undone and will delete all occurrences of this task.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-xl"
            onClick={handleDelete}
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

