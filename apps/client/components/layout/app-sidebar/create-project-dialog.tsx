"use client";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { PlusIcon } from "lucide-react";
import AddProjectDialog from "@/features/projects/components/add-project-dialog";

export default function CreateProjectDialog() {
  return (
    <AddProjectDialog
      trigger={
        <SidebarMenuButton
          tooltip="Add project"
          className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 cursor-pointer"
        >
          <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
          <span>Add project</span>
        </SidebarMenuButton>
      }
    />
  );
}