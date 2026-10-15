"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  InboxIcon,
  TagsIcon,
  CalendarDaysIcon,
  HomeIcon,
  PlusIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAddTaskDialogStore } from "@/providers/MyStoreProvider"
import { Kbd } from "@/components/ui/kbd"

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
  const openDialog = useAddTaskDialogStore((state) => state.openDialog)

  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-0.5">
        <SidebarMenuItem>
          <SidebarMenuButton onClick={() => openDialog()} tooltip="Add task (Q)">
            <PlusIcon className="rounded-full bg-primary text-primary-foreground" />
            <div className="w-full flex items-center justify-between">
              <span className="shrink-0 font-semibold text-primary">Add task</span>
              <Kbd> Q </Kbd>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>

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