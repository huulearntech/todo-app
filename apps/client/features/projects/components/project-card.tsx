"use client";

import Link from "next/link";
import { type ProjectResponseDto as Project } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import {
  HashIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  CopyIcon,
} from "lucide-react";

export interface ProjectCardProps {
  project: Project;
  isDefault?: boolean;
  onEdit: (project: Project) => void;
  onCopyLink: (projectId: string) => void;
}

export function ProjectCard({
  project,
  isDefault = false,
  onEdit,
  onCopyLink,
}: ProjectCardProps) {
  const config = getColorConfig(project.colorKey);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-150 select-none"
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-4">
        <div
          className={`flex size-9 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 border ${config.badgeBgClass} ${config.badgeBorderClass} ${config.badgeTextClass}`}
        >
          <HashIcon className="size-4.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="item-title group-hover:text-primary transition-colors truncate">
              {project.name}
            </span>
            {isDefault && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium text-muted-foreground border-border/60"
              >
                Default
              </Badge>
            )}
          </div>
          {project.description && (
            <span className="helper-text truncate mt-0.5">
              {project.description}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
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
            <span className="sr-only">Project options</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-xl p-1 shadow-md"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => onEdit(project)}
                className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <PencilIcon className="size-3.5 text-muted-foreground" />
                <span>Edit project</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onCopyLink(project.id)}
                className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <CopyIcon className="size-3.5 text-muted-foreground" />
                <span>Copy link</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  toast.add({
                    title: "Delete project",
                    description:
                      "Project deletion functionality will be available soon.",
                    type: "info",
                  });
                }}
                className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
              >
                <Trash2Icon className="size-3.5" />
                <span>Delete project</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRightIcon className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
