"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTransferOwnership } from "@/features/projects/hooks/use-transfer-ownership";
import { useRemoveMember } from "@/features/projects/hooks/use-remove-member";
import { useDeleteProject } from "@/features/projects/hooks/use-delete-project";
import type { ProjectResponseDto } from "@todo/shared";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2Icon, ShieldAlertIcon, Trash2Icon } from "lucide-react";

interface OwnerLeaveGuardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectResponseDto;
  onSuccess?: () => void;
}

export function OwnerLeaveGuardDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: OwnerLeaveGuardDialogProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const otherMembers = (project.members || []).filter(
    (m) => m.userId !== currentUserId,
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    otherMembers[0]?.userId || "",
  );

  const transferOwnership = useTransferOwnership(project.id);
  const removeMember = useRemoveMember(project.id);
  const deleteProject = useDeleteProject();

  const isPending =
    transferOwnership.isPending ||
    removeMember.isPending ||
    deleteProject.isPending;

  const handleTransferAndLeave = async () => {
    if (!selectedMemberId) return;

    try {
      // 1. Transfer ownership to chosen member (old owner becomes Admin)
      await transferOwnership.mutateAsync({
        newOwnerId: selectedMemberId,
      });

      // 2. Voluntarily leave the project now that caller is Admin
      if (currentUserId) {
        await removeMember.mutateAsync(currentUserId);
      }

      toast.add({
        title: "Ownership transferred",
        description: `Ownership was transferred and you have left "${project.name}".`,
        type: "success",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.add({
        title: "Action failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not transfer ownership.",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.add({
        title: "Project deleted",
        description: `"${project.name}" has been deleted.`,
        type: "success",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.add({
        title: "Deletion failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not delete project.",
        type: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2.5 text-amber-500">
            <ShieldAlertIcon className="size-5 shrink-0" />
            <DialogTitle className="text-base font-semibold text-foreground">
              Transfer ownership before leaving
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {otherMembers.length > 0
              ? "You must transfer ownership to another member before leaving this project."
              : "You are the only member in this project. To leave, delete this project instead."}
          </DialogDescription>
        </DialogHeader>

        {otherMembers.length > 0 ? (
          <div className="flex flex-col gap-2 my-2">
            <label className="text-xs font-medium text-foreground">
              Choose New Owner
            </label>
            <Select
              value={selectedMemberId}
              onValueChange={(val) => {
                if (val) setSelectedMemberId(val);
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-full text-xs rounded-xl h-9">
                <SelectValue placeholder="Select a collaborator" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.userId}
                    className="text-xs capitalize"
                  >
                    {member.user?.name || member.user?.email} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <DialogFooter className="gap-2 mt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>

          {otherMembers.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleTransferAndLeave}
              disabled={isPending || !selectedMemberId}
              className="rounded-xl text-xs gap-1.5"
            >
              {isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : null}
              Transfer Ownership & Leave
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl text-xs gap-1.5"
            >
              {isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <Trash2Icon className="size-3.5" />
              )}
              Delete Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
