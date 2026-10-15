"use client";

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
  task: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (task: { id: string; title: string }) => void;
}

export function DeleteTaskAlertDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
}: DeleteTaskAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task Permanently</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete &ldquo;
            {task?.title || "this task"}&rdquo;?
            This action cannot be undone and will delete all occurrences of this task.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              if (task) {
                onConfirm(task);
                onOpenChange(false);
              }
            }}
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
