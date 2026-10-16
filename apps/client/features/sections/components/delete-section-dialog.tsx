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
import { useDeleteSection } from "../hooks/use-delete-section";
import type { SectionResponseDto } from "@todo/shared";

export interface DeleteSectionDialogProps {
  section: SectionResponseDto;
  onClose: () => void;
  onConfirm?: (section: SectionResponseDto) => void;
}

export function DeleteSectionDialog({
  section,
  onClose,
  onConfirm,
}: DeleteSectionDialogProps) {
  const [open, setOpen] = useState(true)

  const deleteMutation = useDeleteSection(section.projectId);

  const handleDelete = () => {
    deleteMutation.mutate(section.id, {
      onSuccess: () => {
        onConfirm?.(section);
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Section</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;
            {section.name}&rdquo;?
            Tasks inside this section will not be deleted immediately, but will become unsectioned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="rounded-xl"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            className="rounded-xl"
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
