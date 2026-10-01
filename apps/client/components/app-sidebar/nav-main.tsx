"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  InboxIcon,
  TagsIcon,
  CalendarDaysIcon,
  HomeIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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
]

export function NavMain() {
  const pathname = usePathname()

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            (item.url !== "/" && pathname.startsWith(item.url))

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.name}
                render={<Link href={item.url} />}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}