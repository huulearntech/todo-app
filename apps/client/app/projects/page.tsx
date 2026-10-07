"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { useAuth } from "@/providers/AuthProvider";
import Header from "@/components/header";
import AddProjectDialog from "./add-project-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FolderIcon,
  HashIcon,
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { useEditProjectDialog } from "@/providers/EditProjectProvider";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { openEditProjectDialog } = useEditProjectDialog();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "non_default"],
    queryFn: () => projectService.getMyNonDefaultProjects(),
    // queryKey: ["projects"],
    // queryFn: () => projectService.getMyProjects(),
  });

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  const handleCopyLink = (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(url);
    toast.add({
      title: "Link copied",
      description: "Project link has been copied to your clipboard.",
      type: "success",
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full overflow-y-auto min-h-0">
        <div className="mx-auto flex flex-col gap-6 w-full max-w-4xl p-4 sm:p-6 md:p-8">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FolderIcon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Projects
                  </h1>
                  {!isLoading && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {projects.length}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Manage and organize your project boards and tasks.
                </p>
              </div>
            </div>

            <AddProjectDialog
              trigger={
                <Button className="gap-2 rounded-xl font-medium shrink-0 shadow-xs">
                  <PlusIcon className="size-4" />
                  <span>New Project</span>
                </Button>
              }
            />
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-card border-border/70 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          {/* Projects List */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/40">
              <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
                <FolderPlusIcon className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {searchQuery ? "No matching projects" : "No projects yet"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {searchQuery
                  ? `No projects found matching "${searchQuery}". Try a different keyword.`
                  : "Create your first project to start organizing tasks into custom Kanban boards."}
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl mt-4 text-xs font-medium"
                >
                  Clear search
                </Button>
              ) : (
                <AddProjectDialog
                  trigger={
                    <Button
                      size="sm"
                      className="gap-2 rounded-xl mt-4 text-xs font-semibold shadow-xs"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Create Project</span>
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredProjects.map((project) => {
                const isDefault = user?.defaultProjectId === project.id;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/40 shadow-xs hover:shadow-sm transition-all duration-150 select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div
                        className="flex size-9 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 border"
                        style={{
                          backgroundColor: `${project.colorHexCode || "#E0E0E0"}20`,
                          borderColor: `${project.colorHexCode || "#E0E0E0"}40`,
                          color: project.colorHexCode || "#E0E0E0",
                        }}
                      >
                        <HashIcon className="size-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
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
                          <span className="text-xs text-muted-foreground truncate mt-0.5">
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
                              onClick={() => openEditProjectDialog(project)}
                              className="gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                            >
                              <PencilIcon className="size-3.5 text-muted-foreground" />
                              <span>Edit project</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(project.id)}
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
              })}

              {/* Quick Add trigger at the bottom of the list */}
              <AddProjectDialog
                trigger={
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-card/40 hover:bg-accent/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer mt-1"
                  >
                    <PlusIcon className="size-4 text-primary" />
                    <span>Add new project</span>
                  </button>
                }
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}