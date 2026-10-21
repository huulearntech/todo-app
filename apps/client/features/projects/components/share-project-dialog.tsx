"use client";

import { useState } from "react";
import { ProjectRole, type ProjectMemberResponseDto } from "@todo/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/providers/AuthProvider";
import { useProjectAbilityContext, useProjectAbility } from "@/features/projects/permissions";
import { useProject } from "@/features/projects/hooks/use-project";
import {
  useProjectMembers,
  EMPTY_MEMBERS,
} from "@/features/projects/hooks/use-project-members";
import {
  useProjectInvitations,
  EMPTY_INVITATIONS,
} from "@/features/projects/hooks/use-project-invitations";
import { useCreateInvitation } from "@/features/projects/hooks/use-create-invitation";
import { useUpdateMemberRole } from "@/features/projects/hooks/use-update-member-role";
import { useRemoveMember } from "@/features/projects/hooks/use-remove-member";
import { useRevokeInvitation } from "@/features/projects/hooks/use-revoke-invitation";
import { useResendInvitation } from "@/features/projects/hooks/use-resend-invitation";
import {
  useCollaboratorSuggestions,
  EMPTY_SUGGESTIONS,
} from "@/features/projects/hooks/use-collaborator-suggestions";
import {
  Loader2Icon,
  UsersIcon,
} from "lucide-react";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";
import { toast } from "@/components/ui/toast";
import { ShareProjectInviteForm } from "./share-project/share-project-invite-form";
import { ProjectMemberRow } from "./share-project/project-member-row";
import { ProjectInvitationRow } from "./share-project/project-invitation-row";
import { ShareProjectProvider } from "./share-project/share-project-context";

type AssignableRole =
  | ProjectRole.ADMIN
  | ProjectRole.EDITOR
  | ProjectRole.VIEWER;

export interface ShareProjectDialogProps {
  projectId: string;
  onClose: () => void;
}

export default function ShareProjectDialog({
  projectId,
  onClose,
}: ShareProjectDialogProps) {
  const [open, setOpen] = useState(true);
  const [recentTokens, setRecentTokens] = useState<Record<string, string>>({});
  const [transferTarget, setTransferTarget] =
    useState<ProjectMemberResponseDto | null>(null);

  const { user } = useAuth();
  const contextAbility = useProjectAbilityContext();

  const { data: project } = useProject(projectId);
  const projectName = project?.name || "Project";

  const { data: members = EMPTY_MEMBERS, isLoading: isLoadingMembers } =
    useProjectMembers(projectId);

  const currentMember = members.find((m) => m.userId === user?.id);
  const resolvedRole = currentMember?.role ?? contextAbility.role;
  const ability = useProjectAbility(resolvedRole);

  const { data: invitations = EMPTY_INVITATIONS } = useProjectInvitations(
    ability.can("member:read") ? projectId : undefined,
  );

  const createInvitation = useCreateInvitation(projectId);
  const updateMemberRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const revokeInvitation = useRevokeInvitation(projectId);
  const resendInvitation = useResendInvitation(projectId);

  const { data: suggestions = EMPTY_SUGGESTIONS } = useCollaboratorSuggestions(
    projectId,
    "",
    true,
  );

  const canInvite = ability.can("member:invite");

  const handleSendInvite = async (email: string, role: ProjectRole) => {
    const res = await createInvitation.mutateAsync({
      email,
      role: role as AssignableRole,
    });

    toast.add({
      title: "Invitation sent",
      description: `An email invitation was sent to ${email}`,
      type: "success",
    });

    // Save token locally in case owner wants to also copy link directly
    if (typeof window !== "undefined" && res.token) {
      setRecentTokens((prev) => ({
        ...prev,
        [res.invitation.id]: `${window.location.origin}/invitations/accept?token=${res.token}`,
      }));
    }
  };

  const handleResend = (invitationId: string) => {
    resendInvitation.mutate(invitationId, {
      onSuccess: (data) => {
        if (data.token) {
          const fullUrl = `${window.location.origin}/invitations/accept?token=${data.token}`;
          setRecentTokens((prev) => ({
            ...prev,
            [data.invitation.id]: fullUrl,
          }));
        }
      },
    });
  };

  const handleCopyLink = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.add({
        title: "Link copied",
        description: "Invitation link copied to clipboard",
        type: "success",
      });
    }
  };

  const shareProjectContextValue = {
    projectId,
    ability,
    currentUserId: user?.id,
    members,
    invitations,
    suggestions,
    recentTokens,
    isInviting: createInvitation.isPending,
    isUpdatingRole: updateMemberRole.isPending,
    isRemovingMember: removeMember.isPending,
    isResendingInvite: resendInvitation.isPending,
    isRevokingInvite: revokeInvitation.isPending,
    onSendInvite: handleSendInvite,
    onUpdateRole: (userId: string, role: ProjectRole) =>
      updateMemberRole.mutate({
        userId,
        dto: { role: role as AssignableRole },
      }),
    onRemoveMember: (userId: string) => removeMember.mutate(userId),
    onTransfer: (member: ProjectMemberResponseDto) => setTransferTarget(member),
    onCopyLink: handleCopyLink,
    onResendInvite: handleResend,
    onRevokeInvite: (invitationId: string) => revokeInvitation.mutate(invitationId),
  };

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
      <DialogContent className="sm:max-w-[480px] w-full p-6 gap-5 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="gap-1 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold truncate">
            <UsersIcon className="size-4 text-primary shrink-0" />
            <span className="truncate">Share &ldquo;{projectName}&rdquo;</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Invite team members to collaborate on tasks in this project.
          </DialogDescription>
        </DialogHeader>

        <ShareProjectProvider value={shareProjectContextValue}>
          {/* Invite Form */}
          {canInvite && <ShareProjectInviteForm />}

          {/* Scrollable Container for Members and Pending Invites */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 -mr-1 pr-1 w-full min-w-0">
            {/* Members List */}
            <div className="flex flex-col gap-2 w-full min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Members ({members.length})
              </span>

              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col gap-1 w-full min-w-0">
                  {members.map((member) => (
                    <ProjectMemberRow key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border/50 pt-3 w-full min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pending Invitations ({invitations.length})
                </span>
                <div className="flex flex-col gap-1 w-full min-w-0">
                  {invitations.map((inv) => (
                    <ProjectInvitationRow key={inv.id} invitation={inv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ShareProjectProvider>
      </DialogContent>

      <TransferOwnershipDialog
        open={!!transferTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTransferTarget(null);
        }}
        projectId={projectId}
        targetMember={transferTarget}
        onSuccess={() => {
          setTransferTarget(null);
        }}
      />
    </Dialog>
  );
}

export { ShareProjectDialog };
