"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "@/components/ui/toast";

import {
  TagIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  TagsIcon,
} from "lucide-react";

import Dialog_AddLabel from "./add-label-form";
import Dialog_EditLabel from "./temp-edit-label-form";

export default function TempTaskLabelList() {
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
  });

  const [editingLabel, setEditingLabel] = useState<TaskLabel | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<TaskLabel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter labels by search query
  const filteredLabels = useMemo(() => {
    if (!searchQuery.trim()) return labels;
    const query = searchQuery.toLowerCase();
    return labels.filter(
      (label) =>
        label.name.toLowerCase().includes(query) ||
        (label.description && label.description.toLowerCase().includes(query))
    );
  }, [labels, searchQuery]);

  const handleDeleteConfirm = () => {
    if (!deletingLabel) return;

    // TODO: [SERVER CALL] Implement actual server call for deleting a label here.
    // Example:
    // await taskLabelService.deleteTaskLabel(deletingLabel.id);
    // queryClient.invalidateQueries({ queryKey: ["task-labels"] });

    toast.add({
      title: "Label deleted",
      description: `"${deletingLabel.name}" was deleted successfully.`,
      type: "success",
    });

    setDeletingLabel(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl py-2 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <TagsIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Task Labels
              </h1>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {labels.length}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Organize and filter your tasks by custom tags.
            </p>
          </div>
        </div>
        <Dialog_AddLabel />
      </div>

      {/* Search Input */}
      {labels.length > 0 && (
        <div className="relative w-full">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border/70 rounded-xl focus-visible:ring-primary/40"
          />
        </div>
      )}

      {/* Label List */}
      {filteredLabels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/70 text-center bg-card/40 my-2">
          <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
            <TagIcon className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {labels.length === 0 ? "No labels created yet" : "No matching labels found"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {labels.length === 0
              ? "Create your first label to easily group and categorize tasks across projects."
              : `No labels matched "${searchQuery}". Try a different keyword.`}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filteredLabels.map((label) => (
            <li key={label.id} className="group relative">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-xs">
                {/* Clickable card area leading to /labels/[id] */}
                <Link
                  href={`/labels/${label.id}`}
                  className="flex flex-1 items-center gap-3.5 min-w-0 pr-2 focus-visible:outline-none"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <TagIcon className="size-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                      {label.name}
                    </span>
                    {label.description ? (
                      <span className="text-xs text-muted-foreground truncate font-normal">
                        {label.description}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic font-normal">
                        No description
                      </span>
                    )}
                  </div>
                </Link>

                {/* Actions Dropdown Pop-up */}
                <div className="flex items-center gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                        />
                      )}
                    >
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Actions for {label.name}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-md">
                      <DropdownMenuItem
                        onClick={() => setEditingLabel(label)}
                        className="gap-2 rounded-lg cursor-pointer text-xs"
                      >
                        <PencilIcon className="size-3.5 text-muted-foreground" />
                        <span>Edit Label</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-border/50" />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingLabel(label)}
                        className="gap-2 rounded-lg cursor-pointer text-xs"
                      >
                        <Trash2Icon className="size-3.5" />
                        <span>Delete Label</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link href={`/labels/${label.id}`} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors p-1">
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Label Dialog */}
      {editingLabel && (
        <Dialog_EditLabel label={editingLabel} setLabel={setEditingLabel} />
      )}

      {/* Delete Label Confirmation Dialog */}
      <AlertDialog open={!!deletingLabel} onOpenChange={(open) => !open && setDeletingLabel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingLabel?.name}"</span>? Tasks tagged with this label will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="rounded-lg"
            >
              Delete Label
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
