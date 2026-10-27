"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useProjectMembers,
  EMPTY_MEMBERS,
} from "@/features/projects/hooks/use-project-members";

import type { ProjectMemberResponseDto } from "@todo/shared";

interface ProjectMemberAvatarStackProps {
  projectId: string;
  members?: ProjectMemberResponseDto[];
  maxDisplay?: number;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function ProjectMemberAvatarStack({
  projectId,
  members: propMembers,
  maxDisplay = 3,
}: ProjectMemberAvatarStackProps) {
  const { data: fetchedMembers = EMPTY_MEMBERS } = useProjectMembers(
    propMembers ? undefined : projectId,
  );
  const members = propMembers ?? fetchedMembers;

  if (!members || members.length <= 1) {
    return null;
  }

  const displayedMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  return (
    <AvatarGroup className="items-center">
      {displayedMembers.map((member) => {
        const displayName = member.user?.name || member.user?.email || "Member";
        const initials = getInitials(member.user?.name, member.user?.email);
        const avatarUrl = member.user?.avatarUrl;

        return (
          <Tooltip key={member.id}>
            <TooltipTrigger
              render={
                <Avatar size="sm" className="cursor-default">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              }
            />
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{displayName}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {member.role}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger
            render={
              <AvatarGroupCount className="cursor-default">
                +{remainingCount}
              </AvatarGroupCount>
            }
          />
          <TooltipContent side="bottom" className="text-xs">
            {remainingCount} more member{remainingCount > 1 ? "s" : ""}
          </TooltipContent>
        </Tooltip>
      )}
    </AvatarGroup>
  );
}
