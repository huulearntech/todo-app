"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useProjects, EMPTY_PROJECTS } from "@/features/projects/hooks/use-projects"
import { getColorConfig } from "@/lib/color-palette"

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
import { useModalStore } from "@/providers/MyStoreProvider"

export function NavProjects() {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const openModal = useModalStore((state) => state.openModal)

  const { data: projects = EMPTY_PROJECTS, isLoading } = useProjects("non_default");

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
          const isActive = pathname === projectUrl || pathname.startsWith(`${projectUrl}/`)
          const config = getColorConfig(item.colorKey)

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
                    onClick={() => openModal({ type: "edit-project", project: item })}
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
