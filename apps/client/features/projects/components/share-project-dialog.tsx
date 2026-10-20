"use client";

import { useState } from "react";
import { ProjectRole, type ProjectMemberResponseDto } from "@todo/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/AuthProvider";
import { useProjectAbilityContext } from "@/features/projects/permissions";
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
import {
  CopyIcon,
  Loader2Icon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  LogOutIcon,
  CrownIcon,
} from "lucide-react";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";
import { toast } from "@/components/ui/toast";

type AssignableRole =
  | ProjectRole.ADMIN
  | ProjectRole.EDITOR
  | ProjectRole.VIEWER;

interface ShareProjectDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
}

export function ShareProjectDialog({
  projectId,
  projectName,
  trigger,
}: ShareProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(ProjectRole.EDITOR);
  const [recentTokens, setRecentTokens] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] =
    useState<ProjectMemberResponseDto | null>(null);

  const { user } = useAuth();
  const ability = useProjectAbilityContext();

  const { data: members = EMPTY_MEMBERS, isLoading: isLoadingMembers } =
    useProjectMembers(open ? projectId : undefined);
  const { data: invitations = EMPTY_INVITATIONS } = useProjectInvitations(
    open && ability.can("member:read") ? projectId : undefined,
  );

  const createInvitation = useCreateInvitation(projectId);
  const updateMemberRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const revokeInvitation = useRevokeInvitation(projectId);

  const canInvite = ability.can("member:invite");

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setErrorMessage(null);
    try {
      const res = await createInvitation.mutateAsync({
        email: trimmedEmail,
        role,
      });

      toast.add({
        title: "Invitation sent",
        description: `An email invitation was sent to ${trimmedEmail}`,
        type: "success",
      });

      // Save token locally in case owner wants to also copy link directly
      if (typeof window !== "undefined" && res.token) {
        setRecentTokens((prev) => ({
          ...prev,
          [res.invitation.id]: `${window.location.origin}/invitations/accept?token=${res.token}`,
        }));
      }

      setEmail("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setErrorMessage(msg || "Failed to send invitation. Please check the email.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (props) => <span {...props}>{trigger}</span>
          ) : (
            (props) => (
              <Button
                {...props}
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg text-xs font-medium cursor-pointer"
              >
                <UserPlusIcon className="size-3.5 text-muted-foreground" />
                <span>Share</span>
              </Button>
            )
          )
        }
      />
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

        {/* Invite Form */}
        {canInvite && (
          <form
            onSubmit={handleSendInvite}
            className="flex flex-col gap-2 shrink-0 w-full min-w-0"
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-xs flex-1 min-w-0"
                disabled={createInvitation.isPending}
              />
              <Select
                value={role}
                onValueChange={(val) => val && setRole(val as AssignableRole)}
                disabled={createInvitation.isPending}
              >
                <SelectTrigger className="w-24 shrink-0 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ability.assignableRoles.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3.5 text-xs shrink-0 cursor-pointer"
                disabled={createInvitation.isPending || !email.trim()}
              >
                {createInvitation.isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-destructive leading-tight">
                {errorMessage}
              </p>
            )}
          </form>
        )}

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
                {members.map((member) => {
                  const isCurrentUser = member.userId === user?.id;
                  const isMemberOwner = member.role === ProjectRole.OWNER;
                  const canEditThisMember = ability.assignableRoles.some((r) =>
                    ability.canChangeMemberRole(member.role, r),
                  );
                  const canRemoveThisMember = ability.canRemoveMember(
                    member.role,
                    isCurrentUser,
                  );

                  const initials = (
                    member.user?.name ||
                    member.user?.email ||
                    "U"
                  )
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors gap-2 w-full min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-[11px] font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-medium truncate text-foreground">
                              {member.user?.name || member.user?.email}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                (you)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {member.user?.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isMemberOwner ? (
                          <Badge
                            variant="secondary"
                            className="text-[11px] gap-1 font-normal shrink-0"
                          >
                            <ShieldIcon className="size-3 text-amber-500" />
                            Owner
                          </Badge>
                        ) : canEditThisMember ? (
                          <Select
                            value={member.role}
                            onValueChange={(val) => {
                              if (val) {
                                updateMemberRole.mutate({
                                  userId: member.userId,
                                  dto: { role: val as AssignableRole },
                                });
                              }
                            }}
                            disabled={updateMemberRole.isPending}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ability.assignableRoles
                                .filter((r) =>
                                  ability.canChangeMemberRole(member.role, r),
                                )
                                .map((r) => (
                                  <SelectItem
                                    key={r}
                                    value={r}
                                    className="capitalize"
                                  >
                                    {r}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] capitalize shrink-0"
                          >
                            {member.role}
                          </Badge>
                        )}

                        {/* Transfer Ownership Action */}
                        {ability.can("project:transfer") &&
                        !isMemberOwner &&
                        !isCurrentUser ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-amber-500 cursor-pointer shrink-0"
                            title="Transfer ownership to this member"
                            onClick={() => setTransferTarget(member)}
                          >
                            <CrownIcon className="size-3.5" />
                          </Button>
                        ) : null}

                        {/* Remove or Leave Action */}
                        {isCurrentUser && canRemoveThisMember ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                            title="Leave project"
                            disabled={removeMember.isPending}
                            onClick={() => removeMember.mutate(member.userId)}
                          >
                            <LogOutIcon className="size-3.5" />
                          </Button>
                        ) : canRemoveThisMember ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                            title="Remove member"
                            disabled={removeMember.isPending}
                            onClick={() => removeMember.mutate(member.userId)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
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
                {invitations.map((inv) => {
                  const inviteUrl = recentTokens[inv.id];
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/20 text-xs gap-2 w-full min-w-0"
                    >
                      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                        <span className="truncate font-medium text-foreground">
                          {inv.invitedEmail}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {inv.role} &bull; Invited
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {inviteUrl && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                            title="Copy invitation link"
                            onClick={async () => {
                              await navigator.clipboard.writeText(inviteUrl);
                              toast.add({
                                title: "Copied",
                                description:
                                  "Invitation link copied to clipboard",
                                type: "success",
                              });
                            }}
                          >
                            <CopyIcon className="size-3.5" />
                          </Button>
                        )}
                        {canInvite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2 shrink-0 cursor-pointer"
                            disabled={revokeInvitation.isPending}
                            onClick={() => revokeInvitation.mutate(inv.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <TransferOwnershipDialog
        open={!!transferTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTransferTarget(null);
        }}
        projectId={projectId}
        projectName={projectName}
        targetMember={transferTarget}
        onSuccess={() => {
          setTransferTarget(null);
        }}
      />
    </Dialog>
  );
}
