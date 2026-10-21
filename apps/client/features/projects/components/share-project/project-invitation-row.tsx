"use client";

import type { ProjectInvitationResponseDto } from "@todo/shared";
import { Button } from "@/components/ui/button";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useShareProjectContext } from "./share-project-context";

export interface ProjectInvitationRowProps {
  invitation: ProjectInvitationResponseDto;
}

export function ProjectInvitationRow({
  invitation,
}: ProjectInvitationRowProps) {
  const {
    ability,
    recentTokens,
    onCopyLink,
    onResendInvite,
    isResendingInvite,
    onRevokeInvite,
    isRevokingInvite,
  } = useShareProjectContext();

  const inviteUrl = recentTokens[invitation.id];
  const canInvite = ability.can("member:invite");
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/20 text-xs gap-2 w-full min-w-0">
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="truncate font-medium text-foreground">
          {invitation.invitedEmail}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {invitation.role} &bull; Invited
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {inviteUrl && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Copy invitation link"
            onClick={() => onCopyLink(inviteUrl)}
          >
            <CopyIcon className="size-3.5" />
          </Button>
        )}

        {canInvite && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Resend invitation (generates new link & resets expiry)"
            disabled={isResendingInvite}
            onClick={() => onResendInvite(invitation.id)}
          >
            <RefreshCwIcon
              className={cn("size-3.5", isResendingInvite && "animate-spin")}
            />
          </Button>
        )}

        {canInvite && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2 shrink-0 cursor-pointer"
            disabled={isRevokingInvite}
            onClick={() => onRevokeInvite(invitation.id)}
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}
