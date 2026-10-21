"use client";

import { useState } from "react";
import {
  type ProjectResponseDto as Project,
  ProjectRole,
} from "@todo/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import { useDeleteProject } from "@/features/projects/hooks/use-delete-project";
import { useRemoveMember } from "@/features/projects/hooks/use-remove-member";
import {
  getProjectMember,
  isProjectShared,
} from "@/features/projects/utils/project-helpers";
import { useProjectAbility } from "@/features/projects/permissions";
import { OwnerLeaveGuardDialog } from "./owner-leave-guard-dialog";
import { useModalStore } from "@/providers/MyStoreProvider";
import { toast } from "@/components/ui/toast";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  CopyIcon,
  LogOutIcon,
} from "lucide-react";

export interface ProjectCardMenuProps {
  project: Project;
}

export function ProjectCardMenu({ project }: ProjectCardMenuProps) {
  const openModal = useModalStore((state) => state.openModal);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const { user } = useAuth();
  const deleteProject = useDeleteProject();
  const removeMember = useRemoveMember(project.id);

  const currentUserId = user?.id;
  const myMember = getProjectMember(project, currentUserId);
  const myRole = myMember?.role;
  const ability = useProjectAbility(myRole);
  const isOwner = myRole === ProjectRole.OWNER;
  const isShared = isProjectShared(project);

  const canUpdate = ability.can("project:update");
  const canDelete = ability.can("project:delete");
  const canLeave = ability.canLeave;

  const handleLeaveClick = () => {
    if (isOwner) {
      setShowGuardModal(true);
    } else if (currentUserId) {
      if (
        confirm(
          `Are you sure you want to leave "${project.name}"? You will lose access to this board.`
        )
      ) {
        removeMember.mutate(currentUserId);
      }
    }
  };

  const handleDeleteClick = () => {
    if (
      confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      deleteProject.mutate(project.id);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/projects/${project.id}`;
    navigator.clipboard.writeText(url);
    toast.add({
      title: "Link copied",
      description: "Project link has been copied to your clipboard.",
      type: "success",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0 cursor-pointer"
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
                onClick={() => openModal({ type: "edit-project", project })}
                className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <PencilIcon className="size-3.5 text-muted-foreground" />
                <span>Edit project</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleCopyLink}
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

      {/* Owner Leave Guard Dialog */}
      {isOwner && (
        <OwnerLeaveGuardDialog
          open={showGuardModal}
          onOpenChange={setShowGuardModal}
          project={project}
        />
      )}
    </>
  );
}
