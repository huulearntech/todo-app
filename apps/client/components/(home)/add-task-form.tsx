"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useAuth } from "@/providers/AuthProvider";
import { useAddTaskDialogStore } from "@/providers/MyStoreProvider";
import { UnifiedTaskAddForm } from "./unified-task-add-form";

export function AddTaskFormTrigger({
  sectionId,
  projectId,
}: {
  sectionId: string;
  projectId?: string;
}) {
  const openDialog = useAddTaskDialogStore((state) => state.openDialog);

  return (
    <Button
      variant="ghost"
      onClick={() => {
        openDialog({ projectId, sectionId });
      }}
      className="text-xs font-medium text-muted-foreground hover:text-foreground">
      <Plus className="size-3.5" />
      Add Task
    </Button>
  );
}

export default function AddTaskDialog() {
  const { user } = useAuth();
  const projectId = useAddTaskDialogStore((state) => state.projectId);
  const sectionId = useAddTaskDialogStore((state) => state.sectionId);
  const dialogIsOpen = useAddTaskDialogStore((state) => state.dialogIsOpen);
  const openDialog = useAddTaskDialogStore((state) => state.openDialog);
  const closeDialog = useAddTaskDialogStore((state) => state.closeDialog);

  // Global hotkey: Q triggers Add Task dialog anywhere in the app for authenticated users
  useHotkey(
    "Q",
    () => {
      openDialog();
    },
    {
      enabled: Boolean(user) && !dialogIsOpen,
    }
  );

  if (!user) {
    return null;
  }

  return (
    <Dialog
      open={dialogIsOpen}
      onOpenChange={(open) => {
        if (open) {
          openDialog();
        } else {
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          <DialogTitle className="text-sm font-semibold">Add Task</DialogTitle>
        </DialogHeader>

        {dialogIsOpen && (
          <UnifiedTaskAddForm
            defaultProjectId={projectId}
            defaultSectionId={sectionId}
            autoFocus={true}
            onSuccess={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}