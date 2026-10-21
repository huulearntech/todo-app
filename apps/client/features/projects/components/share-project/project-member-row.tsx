"use client";

import { ProjectRole, type ProjectMemberResponseDto } from "@todo/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CrownIcon,
  LogOutIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";

import { useShareProjectContext } from "./share-project-context";

export interface ProjectMemberRowProps {
  member: ProjectMemberResponseDto;
}

export function ProjectMemberRow({ member }: ProjectMemberRowProps) {
  const {
    currentUserId,
    ability,
    onUpdateRole,
    isUpdatingRole,
    onTransfer,
    onRemoveMember,
    isRemovingMember,
  } = useShareProjectContext();

  const isCurrentUser = member.userId === currentUserId;
  const isMemberOwner = member.role === ProjectRole.OWNER;
  const canRemove = ability.canRemoveMember(member.role, isCurrentUser);
  const canTransfer = ability.can("project:transfer");
  const assignableRoles = ability.assignableRoles;
  const canEditThisMember = assignableRoles.some((r) =>
    ability.canChangeMemberRole(member.role, r)
  );

  const initials = (member.user?.name || member.user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors gap-2 w-full min-w-0">
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
                onUpdateRole(member.userId, val as ProjectRole);
              }
            }}
            disabled={isUpdatingRole}
          >
            <SelectTrigger className="h-7 w-20 text-xs shrink-0 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles
                .filter((r) => ability.canChangeMemberRole(member.role, r))
                .map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="text-[11px] capitalize shrink-0">
            {member.role}
          </Badge>
        )}

        {/* Transfer Ownership Action */}
        {canTransfer && !isMemberOwner && !isCurrentUser && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-amber-500 cursor-pointer shrink-0"
            title="Transfer ownership to this member"
            onClick={() => onTransfer(member)}
          >
            <CrownIcon className="size-3.5" />
          </Button>
        )}

        {/* Remove or Leave Action */}
        {isCurrentUser && canRemove ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
            title="Leave project"
            disabled={isRemovingMember}
            onClick={() => onRemoveMember(member.userId)}
          >
            <LogOutIcon className="size-3.5" />
          </Button>
        ) : canRemove ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
            title="Remove member"
            disabled={isRemovingMember}
            onClick={() => onRemoveMember(member.userId)}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
