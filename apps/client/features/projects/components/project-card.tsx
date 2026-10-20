"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ProjectResponseDto as Project,
  ProjectRole,
  roleCan,
  canLeaveProject,
} from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/providers/AuthProvider";
import { useDeleteProject } from "@/features/projects/hooks/use-delete-project";
import { useRemoveMember } from "@/features/projects/hooks/use-remove-member";
import {
  getProjectMember,
  getProjectOwner,
  isProjectShared,
} from "@/features/projects/utils/project-helpers";
import { ProjectMemberAvatarStack } from "./project-member-avatar-stack";
import { OwnerLeaveGuardDialog } from "./owner-leave-guard-dialog";
import {
  HashIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  CopyIcon,
  LogOutIcon,
} from "lucide-react";

export interface ProjectCardProps {
  project: Project;
  isDefault?: boolean;
  onEdit: (project: Project) => void;
  onCopyLink: (projectId: string) => void;
}

export function ProjectCard({
  project,
  isDefault = false,
  onEdit,
  onCopyLink,
}: ProjectCardProps) {
  const { user } = useAuth();
  const [showGuardModal, setShowGuardModal] = useState(false);

  const config = getColorConfig(project.colorKey);
  const deleteProject = useDeleteProject();
  const removeMember = useRemoveMember(project.id);

  const myMember = getProjectMember(project, user?.id);
  const myRole = myMember?.role;
  const isOwner = myRole === ProjectRole.OWNER;
  const isShared = isProjectShared(project);
  const owner = getProjectOwner(project);

  const canUpdate = myRole ? roleCan(myRole, "project:update") : false;
  const canDelete = myRole ? roleCan(myRole, "project:delete") : false;
  const canLeave = myRole ? canLeaveProject(myRole) : false;

  const handleLeaveClick = () => {
    if (isOwner) {
      setShowGuardModal(true);
    } else if (user?.id) {
      if (
        confirm(
          `Are you sure you want to leave "${project.name}"? You will lose access to this board.`,
        )
      ) {
        removeMember.mutate(user.id);
      }
    }
  };

  const handleDeleteClick = () => {
    if (
      confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      )
    ) {
      deleteProject.mutate(project.id);
    }
  };

  return (
    <>
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
              <span className="sr-only">Project options</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl p-1 shadow-md"
            >
              <DropdownMenuGroup>
                {canUpdate && (
                  <DropdownMenuItem
                    onClick={() => onEdit(project)}
                    className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                  >
                    <PencilIcon className="size-3.5 text-muted-foreground" />
                    <span>Edit project</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onCopyLink(project.id)}
                  className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                >
                  <CopyIcon className="size-3.5 text-muted-foreground" />
                  <span>Copy link</span>
                </DropdownMenuItem>

                {(canLeave || (isOwner && isShared)) && (
                  <DropdownMenuItem
                    onClick={handleLeaveClick}
                    className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <LogOutIcon className="size-3.5" />
                    <span>Leave project</span>
                  </DropdownMenuItem>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-border/50" />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDeleteClick}
                      className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                    >
                      <Trash2Icon className="size-3.5" />
                      <span>Delete project</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRightIcon className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>

      {/* Owner Leave Guard Dialog */}
      {isOwner && (
        <OwnerLeaveGuardDialog
          open={showGuardModal}
          onOpenChange={setShowGuardModal}
          project={project}
          currentUserId={user?.id}
        />
      )}
    </>
  );
}
