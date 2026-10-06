"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User2Icon,
  ChevronsUpDownIcon,
  LogOutIcon,
  TargetIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/providers/AuthProvider"
import { Skeleton } from "@/components/ui/skeleton"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, isLoading, signOut } = useAuth()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="size-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-2.5 w-28 rounded" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email && email.length > 0) {
      return email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const initials = getInitials(user.name, user.email)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <SidebarMenuButton
                  {...props}
                  size="lg"
                  tooltip={user.name || user.email}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg p-2"
                />
              )}
            >
              <Avatar className="size-8 rounded-lg shrink-0">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name || "User avatar"} />
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-sidebar-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl p-1 shadow-md border-border/60"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={6}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 px-2.5 py-2 text-left text-sm rounded-lg bg-sidebar-accent/50">
                    <Avatar className="size-8 rounded-lg shrink-0">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name || "User avatar"} />
                      <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium text-foreground">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuGroup className="space-y-0.5">
                <DropdownMenuItem render={<Link href="/profile" />} className="rounded-lg gap-2 cursor-pointer">
                  <User2Icon className="size-4 text-muted-foreground" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/productivity" />} className="rounded-lg gap-2 cursor-pointer">
                  <TargetIcon className="size-4 text-muted-foreground" />
                  <span>Productivity</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setShowSignOutDialog(true)}
                className="rounded-lg gap-2 cursor-pointer"
              >
                <LogOutIcon className="size-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account? You will need to sign in again to access your tasks and projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => signOut()}
              className="rounded-lg"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
