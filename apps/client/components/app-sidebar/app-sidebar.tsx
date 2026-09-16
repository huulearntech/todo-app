"use client"

import * as React from "react"

import {
  Calendar1,
  PlusCircle,
  Inbox,
  Tags, // NOTE: this is for labels
  Search,
  CalendarDays
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      name: "Add Task",
      url: "#",
      icon: PlusCircle,
    },
    {
      name: "Search",
      url: "#",
      icon: Search,
    },
    {
      name: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
    {
      name: "Today",
      url: "/today",
      icon: Calendar1,
    },
    {
      name: "Upcoming",
      url: "/upcoming",
      icon: CalendarDays,
    },
    {
      name: "Labels",
      url: "/labels",
      icon: Tags,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader>
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}