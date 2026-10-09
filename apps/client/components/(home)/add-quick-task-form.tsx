"use client";

import { UnifiedTaskAddForm, type UnifiedTaskAddFormProps } from "./unified-task-add-form";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export type AddQuickTaskFormProps = UnifiedTaskAddFormProps;

export default function AddQuickTaskForm({
  defaultProjectId,
  defaultSectionId,
  className,
  placeholder = "Add quick task (e.g. Finish slides #Work/Sprint 1 %urgent p1 {tomorrow at 3pm} // Review with team)...",
  onSuccess,
  onCancel,
  ...props
}: AddQuickTaskFormProps) {
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <UnifiedTaskAddForm
        variant="inline"
        defaultProjectId={defaultProjectId}
        defaultSectionId={defaultSectionId}
        placeholder={placeholder}
        onSuccess={onSuccess}
        onCancel={onCancel}
        {...props}
      />

      {/* Syntax shortcuts hint banner */}
      <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground/60 select-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-muted-foreground/80">Shortcuts:</span>
          <span className="font-mono text-muted-foreground/90">#project</span>
          <span className="font-mono text-muted-foreground/90">/section</span>
          <span className="font-mono text-muted-foreground/90">%label</span>
          <span className="font-mono text-muted-foreground/90">p1..p4</span>
          <span className="font-mono text-muted-foreground/90">&#123;date&#125;</span>
          <span className="font-mono text-muted-foreground/90">{"//notes"}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Kbd>Q</Kbd>
          <span>to focus</span>
        </div>
      </div>
    </div>
  );
}