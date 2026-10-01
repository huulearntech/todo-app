"use client"

import * as React from "react"
import Link from "next/link"
import { CheckSquareIcon } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="z-20 border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Todo"
              render={<Link href="/" />}
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
                <CheckSquareIcon className="size-4.5 stroke-[2.2]" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sidebar-foreground tracking-tight text-sm">
                  Todo
                </span>
                <span className="truncate text-xs text-muted-foreground font-normal">
                  Tasks & Projects
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-1 gap-2">
        <NavMain />
        <SidebarSeparator className="mx-0 my-1 bg-sidebar-border/60 group-data-[collapsible=icon]:hidden" />
        <NavProjects />
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}