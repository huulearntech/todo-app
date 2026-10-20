"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function ProjectMemberAvatarStack({
  projectId,
  members: propMembers,
  maxDisplay = 3,
}: ProjectMemberAvatarStackProps) {
  const { data: fetchedMembers = EMPTY_MEMBERS } = useProjectMembers(
    propMembers ? "" : projectId,
  );
  const members = propMembers ?? fetchedMembers;

  if (!members || members.length <= 1) {
    return null;
  }

  const displayedMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {displayedMembers.map((member) => {
        const initials = (member.user?.name || member.user?.email || "U")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Avatar
            key={member.id}
            size="sm"
            className="ring-2 ring-background border border-border/40 shrink-0"
            title={`${member.user?.name || member.user?.email} (${member.role})`}
          >
            <AvatarImage src="" />
            <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        );
      })}

      {remainingCount > 0 && (
        <div
          className="flex size-6 items-center justify-center rounded-full bg-muted/80 text-[10px] font-medium text-muted-foreground ring-2 ring-background shrink-0"
          title={`${remainingCount} more member${remainingCount > 1 ? "s" : ""}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
