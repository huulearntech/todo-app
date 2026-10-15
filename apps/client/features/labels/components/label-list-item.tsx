"use client";

import Link from "next/link";
import { TagIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";

export interface LabelListItemProps {
  label: TaskLabel;
  onEdit: (label: TaskLabel) => void;
  onDelete: (label: TaskLabel) => void;
}

export function LabelListItem({ label, onEdit, onDelete }: LabelListItemProps) {
  const config = getColorConfig(label.colorKey);

  return (
    <li className="group relative">
      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 sm:p-3.5 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-xs">
        {/* Clickable card area leading to /labels/[id] */}
        <Link
          href={`/labels/${label.id}`}
          className="flex flex-1 items-center gap-3.5 min-w-0 pr-2 focus-visible:outline-none"
        >
          <div
            className={`flex size-9 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 border ${config.badgeBgClass} ${config.badgeBorderClass} ${config.badgeTextClass}`}
          >
            <TagIcon className="size-4.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="item-title truncate group-hover:text-primary transition-colors">
              {label.name}
            </span>
            {label.description ? (
              <span className="helper-text truncate">
                {label.description}
              </span>
            ) : (
              <span className="helper-text text-muted-foreground/50 italic truncate">
                No description
              </span>
            )}
          </div>
        </Link>

        {/* Actions Dropdown */}
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                />
              }
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Actions for {label.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-md">
              <DropdownMenuItem
                onClick={() => onEdit(label)}
                className="gap-2 rounded-lg cursor-pointer text-xs"
              >
                <PencilIcon className="size-3.5 text-muted-foreground" />
                <span>Edit Label</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(label)}
                className="gap-2 rounded-lg cursor-pointer text-xs"
              >
                <Trash2Icon className="size-3.5" />
                <span>Delete Label</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href={`/labels/${label.id}`}
            className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors p-1"
          >
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </li>
  );
}
