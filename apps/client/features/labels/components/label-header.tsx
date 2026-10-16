"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLabels } from "@/features/labels/hooks/use-labels";
import { getColorConfig } from "@/lib/color-palette";

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
import { toast } from "@/components/ui/toast";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon, TagIcon } from "lucide-react";
import EditLabelDialog from "@/features/labels/components/edit-label-dialog";
import { DeleteLabelAlertDialog } from "@/features/labels/components/delete-label-alert-dialog";
import { useDeleteLabel } from "@/features/labels/hooks/use-delete-label";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";

export default function LabelHeader() {
  const params = useParams();
  const router = useRouter();
  const labelId = params?.id as string;

  const { data: labels = [] } = useLabels();
  const deleteLabel = useDeleteLabel();

  const currentLabel = labels.find((l) => l.id === labelId);
  const labelName = currentLabel?.name || "Label";
  const labelConfig = getColorConfig(currentLabel?.colorKey);

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = (label: TaskLabel) => {
    deleteLabel.mutate(label.id, {
      onSuccess: () => {
        toast.add({
          title: "Label deleted",
          description: `"${label.name}" was deleted successfully.`,
          type: "success",
        });
        router.push("/labels");
      },
    });
  };

  return (
    <>
      <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" />
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
                    className={`size-3.5 shrink-0 ${labelConfig.badgeTextClass}`}
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
        <EditLabelDialog
          label={currentLabel}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleting && currentLabel && (
        <DeleteLabelAlertDialog
          label={currentLabel}
          onClose={() => setIsDeleting(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}