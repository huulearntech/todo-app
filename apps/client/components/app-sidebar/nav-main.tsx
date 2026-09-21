"use client"

import {
  InboxIcon,
  TagsIcon,
  CalendarDaysIcon,
  HomeIcon
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const items = [
  {
    name: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    name: "Inbox",
    url: "/inbox",
    icon: InboxIcon,
  },
  {
    name: "Upcoming",
    url: "/upcoming",
    icon: CalendarDaysIcon,
  },
  {
    name: "Labels",
    url: "/labels",
    icon: TagsIcon,
  },
];

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<Link href={item.url} />}>
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}