"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { projectService } from "@/services/project.service"

import {
  HashIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar"
import CreateProjectDialog from "./create-project-dialog"
import { useEditProjectDialog } from "@/providers/EditProjectProvider"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const { openEditProjectDialog } = useEditProjectDialog()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "non_default"],
    queryFn: () => projectService.getMyNonDefaultProjects(),
  })

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
    )
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
          const projectUrl = `/projects/${item.id}`
          const isActive = pathname === projectUrl

          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.name}
                render={<Link href={projectUrl} />}
              >
                <HashIcon
                  className="size-4 shrink-0"
                  style={{ color: item.colorHexCode || undefined }}
                />
                <span className="truncate">{item.name}</span>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      className="hover:bg-sidebar-accent rounded-md"
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
                  <DropdownMenuItem
                    onClick={() => openEditProjectDialog(item)}
                    className="rounded-lg gap-2 cursor-pointer"
                  >
                    <PencilIcon className="size-4 text-muted-foreground" />
                    <span>Edit Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border/50" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="rounded-lg gap-2 cursor-pointer"
                  >
                    <Trash2Icon className="size-4" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}

        <SidebarMenuItem>
          <CreateProjectDialog />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
