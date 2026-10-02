"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useProjectView } from "./project-view-context";
import Link from "next/link";

export default function ProjectHeader() {
  const params = useParams();
  const projectId = params?.id as string;
  const { view, setView } = useProjectView();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="h-4 bg-border/60 shrink-0"
        />
        {isLoading ? (
          <Skeleton className="h-5 w-32 rounded" />
        ) : (
          // <h1 className="font-semibold text-foreground text-sm sm:text-base truncate">
          //   {project?.name || "Project"}
          // </h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/projects" />}>
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage> {project?.name || "Project"} </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

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
        <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 shadow-md">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground font-medium">
              View
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setView("kanban")}
              className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <KanbanIcon className="size-3.5 text-muted-foreground" />
                <span>Kanban view</span>
              </div>
              {view === "kanban" && (
                <CheckIcon className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setView("calendar")}
              className="flex items-center justify-between gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span>Calendar view</span>
              </div>
              {view === "calendar" && (
                <CheckIcon className="size-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
