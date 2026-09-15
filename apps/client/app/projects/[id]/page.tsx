import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { Ellipsis } from "lucide-react";
import AddSectionForm from "../add-section-form";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Project {projectId}</h1>
      <p>Project details and tasks will be displayed here.</p>

      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="outline" className="w-10 h-10 p-0">
            <Ellipsis />
          </Button>
        } />
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>

      </DropdownMenu>

      <AddSectionForm projectId={projectId} />
    </div>
  )
}