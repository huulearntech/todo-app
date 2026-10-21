"use client";

import Link from "next/link";
import {
  type ProjectResponseDto as Project,
  ProjectRole,
} from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import {
  getProjectMember,
  getProjectOwner,
  isProjectShared,
} from "@/features/projects/utils/project-helpers";
import { ProjectMemberAvatarStack } from "./project-member-avatar-stack";
import { ProjectCardMenu } from "./project-card-menu";
import { HashIcon, ChevronRightIcon } from "lucide-react";

export interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useAuth();
  const config = getColorConfig(project.colorKey);
  const isDefault = Boolean(user?.defaultProjectId && user.defaultProjectId === project.id);

  const myMember = getProjectMember(project, user?.id);
  const myRole = myMember?.role;
  const isOwner = myRole === ProjectRole.OWNER;
  const isShared = isProjectShared(project);
  const owner = getProjectOwner(project);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-150 select-none"
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-4">
        <div
          className={`flex size-9 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 border ${config.badgeBgClass} ${config.badgeBorderClass} ${config.badgeTextClass}`}
        >
          <HashIcon className="size-4.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="item-title group-hover:text-primary transition-colors truncate">
              {project.name}
            </span>
            {isDefault && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium text-muted-foreground border-border/60"
              >
                Default
              </Badge>
            )}
            {isShared && myRole && (
              <Badge
                variant="secondary"
                className="text-[10px] capitalize font-medium px-1.5 py-0"
              >
                {myRole}
              </Badge>
            )}
          </div>
          {project.description && (
            <span className="helper-text truncate mt-0.5">
              {project.description}
            </span>
          )}
          {!isOwner && isShared && owner && (
            <span className="text-[11px] text-muted-foreground truncate mt-0.5">
              Owned by {owner.name || owner.email}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Member Avatar Stack on Shared Projects */}
        {isShared && (
          <div className="hidden sm:flex mr-1">
            <ProjectMemberAvatarStack
              projectId={project.id}
              members={project.members}
              maxDisplay={3}
            />
          </div>
        )}

        <ProjectCardMenu project={project} />

        <ChevronRightIcon className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
