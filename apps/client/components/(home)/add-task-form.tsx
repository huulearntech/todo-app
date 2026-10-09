"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);
  const setSectionId = useAddTaskDialogStore((state) => state.setSectionId);
  const setProjectId = useAddTaskDialogStore((state) => state.setProjectId);

  return (
    <Button
      variant="ghost"
      onClick={() => {
        setProjectId(projectId);
        setSectionId(sectionId);
        setDialogIsOpen(true);
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
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);

  if (!user) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    setDialogIsOpen(open);
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          <DialogTitle className="text-sm font-semibold">Add Task</DialogTitle>
        </DialogHeader>

        <UnifiedTaskAddForm
          key={`${projectId || "default"}-${sectionId || "default"}`}
          variant="dialog"
          defaultProjectId={projectId}
          defaultSectionId={sectionId}
          autoFocus={true}
          onSuccess={() => setDialogIsOpen(false)}
          onCancel={() => setDialogIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}