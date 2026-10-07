"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
import { useUpdateTask } from "@/hooks/tasks/use-update-task";
import { updateTaskSchema } from "@todo/shared/browser";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TaskForm } from "@/components/(home)/task-form";

export default function TempEditTaskDialog() {
  const task = useEditTaskDialogStore((state) => state.task);
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  const editTaskMutation = useUpdateTask({
    onSuccess: () => {
      setTask(null);
    },
  });

  if (!task) {
    return null;
  }

  return (
    <Dialog
      open={!!task}
      onOpenChange={(open) => {
        if (!open) setTask(null);
      }}
    >
      <DialogContent className="sm:max-w-[840px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col">
        {/* Header Breadcrumb Banner */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              {task.section?.project?.name && (
                <>
                  <BreadcrumbItem>
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {task.section.project.name}
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {task.section?.name && (
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-[150px]">
                    {task.section.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <DialogTitle className="sr-only">Edit Task: {task.title}</DialogTitle>
        </DialogHeader>

        {/* Shared Todoist Task Form */}
        <TaskForm
          defaultValues={updateTaskSchema.encode(task)}
          onSubmit={(data) => {
            if (task) {
              editTaskMutation.mutate({ taskId: task.id, data });
            }
          }}
          onCancel={() => setTask(null)}
          isPending={editTaskMutation.isPending}
          submitLabel="Save changes"
          submittingLabel="Saving..."
          autoFocusTitle={false}
        />
      </DialogContent>
    </Dialog>
  );
}