"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModalStore } from "@/providers/MyStoreProvider";
import { TaskQuickAddForm } from "./task-quick-add-form";

export function AddTaskDialogTrigger({
  sectionId,
  projectId,
}: {
  sectionId: string;
  projectId?: string;
}) {
  const openModal = useModalStore((state) => state.openModal);

  return (
    <Button
      variant="ghost"
      onClick={() => {
        openModal({ type: "add-task", projectId, sectionId });
      }}
      className="text-xs font-medium text-muted-foreground hover:text-foreground">
      <Plus className="size-3.5" />
      Add Task
    </Button>
  );
}

export interface AddTaskDialogProps {
  projectId?: string;
  sectionId?: string;
  onClose: () => void;
}

export default function AddTaskDialog({
  projectId,
  sectionId,
  onClose,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[700px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col"
      >
        <TaskQuickAddForm
          defaultProjectId={projectId}
          defaultSectionId={sectionId}
          autoFocus={true}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}