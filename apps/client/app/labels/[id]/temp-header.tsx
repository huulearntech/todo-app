"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

import { MoreHorizontalIcon, PencilIcon, Trash2Icon, TagIcon } from "lucide-react";
import Dialog_EditLabel from "../(root)/temp-edit-label-form";

export default function Header() {
  const params = useParams();
  const router = useRouter();
  const labelId = params?.id as string;

  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
  });

  const currentLabel = labels.find((l) => l.id === labelId);
  const labelName = currentLabel?.name || "Label";

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    // TODO: [SERVER CALL] Implement server call here to delete the label.
    // Example:
    // await taskLabelService.deleteTaskLabel(labelId);
    // queryClient.invalidateQueries({ queryKey: ["task-labels"] });

    toast.add({
      title: "Label deleted",
      description: `"${labelName}" was deleted successfully.`,
      type: "success",
    });

    setIsDeleting(false);
    router.push("/labels");
  };

  return (
    <>
      <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="h-4 bg-border/60 shrink-0"
          />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/labels" />} className="text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm">
                  Labels
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm truncate">
                  <TagIcon
                    className="size-3.5 shrink-0"
                    style={{ color: currentLabel?.colorHexCode || undefined }}
                  />
                  <span className="truncate">{labelName}</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Action Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0"
              />
            )}
          >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Label Options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-md">
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="gap-2 rounded-lg cursor-pointer text-xs"
            >
              <PencilIcon className="size-3.5 text-muted-foreground" />
              <span>Edit Label</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setIsDeleting(true)}
              className="gap-2 rounded-lg cursor-pointer text-xs"
            >
              <Trash2Icon className="size-3.5" />
              <span>Delete Label</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Edit Dialog */}
      {isEditing && currentLabel && (
        <Dialog_EditLabel
          label={currentLabel}
          setLabel={(val) => !val && setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{labelName}"</span>? Tasks tagged with this label will not be deleted.
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
    </>
  );
}