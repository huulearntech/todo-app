"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EyeIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/providers/MyStoreProvider";
import { useProjectView } from "@/features/projects/components/project-view-context";
import { useProjectAbilityContext } from "@/features/projects/permissions";
import { ProjectMemberAvatarStack } from "@/features/projects/components/project-member-avatar-stack";
import { ProjectViewDropdownMenu } from "./project-view-dropdown-menu";

interface ProjectHeaderProps {
  projectName: string;
  projectId?: string;
  isDefault?: boolean;
}

function ProjectHeaderBreadcrumbs({
  projectName,
  projectId,
  isCompletedPage,
  isReadOnly,
}: {
  projectName: string;
  projectId?: string;
  isCompletedPage: boolean;
  isReadOnly: boolean;
}) {
  return (
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
          <BreadcrumbItem className="flex items-center gap-2">
            <BreadcrumbPage>{projectName}</BreadcrumbPage>
            {isReadOnly && (
              <Badge
                variant="outline"
                className="text-[11px] text-muted-foreground gap-1 font-normal py-0.5"
              >
                <EyeIcon className="size-3" />
                View only
              </Badge>
            )}
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function ProjectHeader({
  projectName,
  projectId: propProjectId,
  isDefault = false,
}: ProjectHeaderProps) {
  const params = useParams();
  const pathname = usePathname();
  const routeProjectId = params?.id as string;
  const projectId = propProjectId || routeProjectId;
  const isCompletedPage = Boolean(pathname?.endsWith("/completed"));
  const { view, setView } = useProjectView();
  const ability = useProjectAbilityContext();
  const openModal = useModalStore((state) => state.openModal);

  return (
    <header className="px-4 flex h-16 shrink-0 justify-between items-center border-b border-border/60 sticky top-0 z-10 bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" />
        <ProjectHeaderBreadcrumbs
          projectName={projectName}
          projectId={projectId}
          isCompletedPage={isCompletedPage}
          isReadOnly={ability.isReadOnly}
        />
      </div>

      <div className="flex items-center gap-2">
        {!isDefault && projectId && (
          <>
            <ProjectMemberAvatarStack projectId={projectId} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal({ type: "share-project", projectId })}
              className="gap-1.5 rounded-lg text-xs font-medium cursor-pointer"
            >
              <UserPlusIcon className="size-3.5 text-muted-foreground" />
              <span>Share</span>
            </Button>
          </>
        )}

        {projectId && (
          <ProjectViewDropdownMenu
            projectId={projectId}
            view={view}
            onSelectView={setView}
            isCompletedPage={isCompletedPage}
          />
        )}
      </div>
    </header>
  );
}
