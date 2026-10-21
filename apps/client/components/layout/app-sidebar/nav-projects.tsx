"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useProjects, EMPTY_PROJECTS } from "@/features/projects/hooks/use-projects";
import { useDeleteProject } from "@/features/projects/hooks/use-delete-project";
import { useRemoveMember } from "@/features/projects/hooks/use-remove-member";
import { useAuth } from "@/providers/AuthProvider";
import { getColorConfig } from "@/lib/color-palette";
import { roleCan, canLeaveProject, ProjectRole, type ProjectResponseDto } from "@todo/shared";
import {
  getProjectMember,
  isProjectShared,
} from "@/features/projects/utils/project-helpers";
import { OwnerLeaveGuardDialog } from "@/features/projects/components/owner-leave-guard-dialog";

import {
  HashIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  LogOutIcon,
  PlusIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useModalStore } from "@/providers/MyStoreProvider";

export function NavProjects() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const openModal = useModalStore((state) => state.openModal);
  const { user } = useAuth();
  const deleteProject = useDeleteProject();
  const [guardProject, setGuardProject] =
    useState<ProjectResponseDto | null>(null);

  const { data: projects = EMPTY_PROJECTS, isLoading } =
    useProjects("non_default");

  if (isLoading) {
    return (
      <SidebarGroup className="p-0">
        <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
          Projects
        </SidebarGroupLabel>
        <SidebarMenu className="gap-1 mt-1">
          <SidebarMenuSkeleton showIcon />
          <SidebarMenuSkeleton showIcon />
          <SidebarMenuSkeleton showIcon />
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="p-0">
      <div className="flex items-center justify-between px-2 py-1">
        <SidebarGroupLabel className="p-0 text-xs font-medium text-muted-foreground">
          Projects
        </SidebarGroupLabel>
        {projects.length > 0 && (
          <span className="text-[11px] font-medium text-muted-foreground px-1.5 group-data-[collapsible=icon]:hidden">
            {projects.length}
          </span>
        )}
      </div>

      <SidebarMenu className="gap-0.5 mt-0.5">
        {projects.map((item) => {
          const projectUrl = `/projects/${item.id}`;
          const isActive =
            pathname === projectUrl || pathname.startsWith(`${projectUrl}/`);
          const config = getColorConfig(item.colorKey);

          const myMember = getProjectMember(item, user?.id);
          const myRole = myMember?.role;
          const isOwner = myRole === ProjectRole.OWNER;
          const isShared = isProjectShared(item);

          const canUpdate = roleCan(myRole, "project:update");
          const canDelete = roleCan(myRole, "project:delete");
          const canLeave = canLeaveProject(myRole);

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.name}
                render={<Link href={projectUrl} />}
              >
                <HashIcon
                  className={`size-4 shrink-0 ${config.badgeTextClass}`}
                />
                <span className="truncate flex-1">{item.name}</span>
                {isShared && (
                  <span title={myRole ? `Shared (${myRole})` : "Shared"} className="inline-flex shrink-0 ml-auto">
                    <UsersIcon className="size-3 text-muted-foreground opacity-60" />
                  </span>
                )}
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="hover:bg-sidebar-accent rounded-md cursor-pointer"
                    />
                  }
                >
                  <MoreHorizontalIcon className="size-4" />
                  <span className="sr-only">Project options</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-xl p-1 shadow-md border-border/60"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  {canUpdate && (
                    <DropdownMenuItem
                      onClick={() =>
                        openModal({ type: "edit-project", project: item })
                      }
                      className="rounded-lg gap-2 cursor-pointer"
                    >
                      <PencilIcon className="size-4 text-muted-foreground" />
                      <span>Edit Project</span>
                    </DropdownMenuItem>
                  )}

                  {canLeave && user?.id ? (
                    <ProjectLeaveMenuItem
                      projectId={item.id}
                      userId={user.id}
                    />
                  ) : isOwner ? (
                    <DropdownMenuItem
                      onClick={() => setGuardProject(item)}
                      className="rounded-lg gap-2 cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <LogOutIcon className="size-4" />
                      <span>Leave Project</span>
                    </DropdownMenuItem>
                  ) : null}

                  {canDelete && (
                    <>
                      {canUpdate && (
                        <DropdownMenuSeparator className="my-1 bg-border/50" />
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
                            )
                          ) {
                            deleteProject.mutate(item.id);
                          }
                        }}
                        className="rounded-lg gap-2 cursor-pointer"
                      >
                        <Trash2Icon className="size-4" />
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Add project"
            onClick={() => openModal({ type: "add-project" })}
            className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 cursor-pointer"
          >
            <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
            <span>Add project</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {guardProject && (
        <OwnerLeaveGuardDialog
          open={Boolean(guardProject)}
          onOpenChange={(open) => !open && setGuardProject(null)}
          project={guardProject}
        />
      )}
    </SidebarGroup>
  );
}

function ProjectLeaveMenuItem({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const removeMember = useRemoveMember(projectId);

  return (
    <DropdownMenuItem
      variant="destructive"
      onClick={() => {
        if (confirm("Are you sure you want to leave this project?")) {
          removeMember.mutate(userId);
        }
      }}
      disabled={removeMember.isPending}
      className="rounded-lg gap-2 cursor-pointer"
    >
      <LogOutIcon className="size-4" />
      <span>Leave Project</span>
    </DropdownMenuItem>
  );
}
