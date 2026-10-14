"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  MoreHorizontalIcon,
  KanbanIcon,
  CalendarIcon,
  CheckIcon,
} from "lucide-react";
import { useProjectView } from "@/components/projects/project-view-context";

export default function ProjectHeader({ projectName }: { projectName: string }) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params?.id as string;
  const isCompletedPage = pathname?.endsWith("/completed");
  const { view, setView } = useProjectView();

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/projects" />}>
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            {isCompletedPage ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href={`/projects/${projectId}`} />}>
                    {projectName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">
                    Completed
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>{projectName}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0"
              />
            )}
          >
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Project View Options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-md">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground font-medium">
                Views
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setView("kanban");
                }}
                render={
                  isCompletedPage ? (
                    <Link href={`/projects/${projectId}`} />
                  ) : undefined
                }
                className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <KanbanIcon className="size-3.5 text-muted-foreground" />
                  <span>Kanban view</span>
                </div>
                {!isCompletedPage && view === "kanban" && (
                  <CheckIcon className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setView("calendar");
                }}
                render={
                  isCompletedPage ? (
                    <Link href={`/projects/${projectId}`} />
                  ) : undefined
                }
                className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  <span>Calendar view</span>
                </div>
                {!isCompletedPage && view === "calendar" && (
                  <CheckIcon className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
