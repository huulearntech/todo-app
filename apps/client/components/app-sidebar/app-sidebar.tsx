"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { projectService } from "@/services/project.service"

import {
  CalendarPlus,
  PlusCircle,
  Inbox,
  Tags,
  Search
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/default-avatar.svg",
  },
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
      icon: CalendarPlus,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getMyProjects(),
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader>
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}