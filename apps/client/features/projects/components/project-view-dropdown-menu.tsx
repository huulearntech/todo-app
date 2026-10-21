"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontalIcon,
  KanbanIcon,
  CalendarIcon,
  CheckIcon,
} from "lucide-react";

export interface ProjectViewDropdownMenuProps {
  projectId: string;
  view: "kanban" | "calendar";
  onSelectView: (view: "kanban" | "calendar") => void;
  isCompletedPage: boolean;
}

export function ProjectViewDropdownMenu({
  projectId,
  view,
  onSelectView,
  isCompletedPage,
}: ProjectViewDropdownMenuProps) {
  const projectHref = `/projects/${projectId}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0 cursor-pointer"
          />
        )}
      >
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">Project View Options</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl p-1 shadow-md"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1 text-xs text-muted-foreground font-medium">
            Views
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onSelectView("kanban")}
            render={isCompletedPage ? <Link href={projectHref} /> : undefined}
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
            onClick={() => onSelectView("calendar")}
            render={isCompletedPage ? <Link href={projectHref} /> : undefined}
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
  );
}
