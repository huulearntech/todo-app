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
import type { SectionResponseDto } from "@todo/shared";

export interface DeleteSectionDialogProps {
  section: SectionResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (section: SectionResponseDto) => void;
}

export function DeleteSectionDialog({
  section,
  open,
  onOpenChange,
  onConfirm,
}: DeleteSectionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Section</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;
            {section?.name || "Untitled section"}&rdquo;?
            Tasks inside this section will not be deleted immediately, but will become unsectioned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              if (section) {
                onConfirm(section);
                onOpenChange(false);
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
