"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { useTransferOwnership } from "@/features/projects/hooks/use-transfer-ownership";
import type { ProjectMemberResponseDto } from "@todo/shared";
import { Loader2Icon, ShieldAlertIcon } from "lucide-react";

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  targetMember?: ProjectMemberResponseDto | null;
  onSuccess?: () => void;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  targetMember,
  onSuccess,
}: TransferOwnershipDialogProps) {
  const transferOwnership = useTransferOwnership(projectId);

  if (!targetMember) {
    return null;
  }

  const targetName =
    targetMember.user?.name || targetMember.user?.email || "this member";
  const initials = (targetMember.user?.name || targetMember.user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const handleTransfer = async () => {
    try {
      await transferOwnership.mutateAsync({
        newOwnerId: targetMember.userId,
      });

      toast.add({
        title: "Ownership transferred",
        description: `${targetName} is now the owner of "${projectName}". You are now an Administrator.`,
        type: "success",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.add({
        title: "Transfer failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not transfer project ownership.",
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
              Transfer Project Ownership
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Transferring ownership of{" "}
            <span className="font-semibold text-foreground">"{projectName}"</span>{" "}
            will make{" "}
            <span className="font-semibold text-foreground">{targetName}</span> the
            new project owner. You will remain in the project as an{" "}
            <span className="font-semibold text-foreground">Administrator</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 my-2">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">
              {targetMember.user?.name || targetMember.user?.email}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {targetMember.user?.email}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={transferOwnership.isPending}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleTransfer}
            disabled={transferOwnership.isPending}
            className="rounded-xl text-xs gap-1.5"
          >
            {transferOwnership.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : null}
            Transfer Ownership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
