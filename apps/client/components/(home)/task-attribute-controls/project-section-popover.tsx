"use client";

import { useState, useMemo } from "react";
import { FolderIcon, ChevronDownIcon, CheckIcon, SearchIcon, LayersIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSections } from "@/hooks/sections/use-sections";
import { cn } from "@/lib/utils";

export interface ProjectSectionPopoverProps {
  currentProjectId?: string;
  currentSectionId?: string;
  projects: Array<{ id: string; name: string; colorHexCode?: string }>;
  onSelect: (projectId: string, sectionId?: string) => void;
  className?: string;
}

export function ProjectSectionPopover({
  currentProjectId,
  currentSectionId,
  projects,
  onSelect,
  className,
}: ProjectSectionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    currentProjectId || null
  );

  const effectiveProjectId = expandedProjectId ?? currentProjectId;
  const activeProject = useMemo(
    () => projects.find((p) => p.id === effectiveProjectId),
    [projects, effectiveProjectId]
  );

  // Load sections for currentProjectId to ensure activeSection is always resolved for display
  const { data: currentProjectSections = [] } = useSections(currentProjectId || "");
  const {
    data: activeProjectSections = [],
    isLoading: isActiveSectionsLoading,
    isFetching: isActiveSectionsFetching,
  } = useSections(effectiveProjectId || "");

  // Smooth loading indicator: true while sections for effective project are being fetched for the first time
  const isSectionsLoading =
    (isActiveSectionsLoading || isActiveSectionsFetching) &&
    activeProjectSections.length === 0;

  const sections =
    effectiveProjectId === currentProjectId &&
    activeProjectSections.length === 0 &&
    !isActiveSectionsLoading &&
    !isActiveSectionsFetching
      ? currentProjectSections
      : activeProjectSections;

  const activeSection = useMemo(
    () => currentProjectSections.find((s) => s.id === currentSectionId),
    [currentProjectSections, currentSectionId]
  );

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter((s) => s.name.toLowerCase().includes(q));
  }, [sections, search]);

  const displayName = useMemo(() => {
    const proj = projects.find((p) => p.id === currentProjectId);
    if (!proj) return "Select project";
    if (activeSection) {
      return `#${proj.name} / ${activeSection.name}`;
    }
    return `#${proj.name}`;
  }, [projects, currentProjectId, activeSection]);

  const currentColor = projects.find((p) => p.id === currentProjectId)?.colorHexCode;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2.5 rounded-lg text-xs font-normal border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
              className
            )}
          >
            {currentColor ? (
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: currentColor }}
              />
            ) : (
              <FolderIcon className="size-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate max-w-[160px] font-medium text-foreground">
              {displayName}
            </span>
            <ChevronDownIcon className="size-3 text-muted-foreground/70 shrink-0" />
          </Button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-2 flex flex-col gap-2 rounded-xl shadow-xl border-border/80 bg-popover"
      >
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project or section..."
            className="h-7 text-xs pl-8 pr-2 bg-muted/30 border-border/60"
          />
        </div>

        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
          {/* Projects List */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 px-2 py-0.5 tracking-wider">
              Projects
            </span>
            {filteredProjects.map((p) => {
              const isSelected = p.id === currentProjectId;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setExpandedProjectId(p.id);
                    onSelect(p.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left",
                    isSelected
                      ? "bg-accent/60 text-accent-foreground font-medium"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.colorHexCode || "#888888" }}
                    />
                    <span className="truncate">#{p.name}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sections List for selected/expanded project */}
          {activeProject && (
            <div className="flex flex-col gap-0.5 pt-1.5 border-t border-border/40 min-h-[58px]">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 px-2 py-0.5 tracking-wider">
                Sections in #{activeProject.name}
              </span>
              {isSectionsLoading ? (
                <div className="flex flex-col gap-1.5 px-4 py-1.5 animate-pulse">
                  <div className="h-4 w-28 bg-muted/70 rounded-md" />
                  <div className="h-4 w-20 bg-muted/50 rounded-md" />
                </div>
              ) : filteredSections.length > 0 ? (
                filteredSections.map((s) => {
                  const isSectionSelected = s.id === currentSectionId;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        onSelect(activeProject.id, s.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left pl-4",
                        isSectionSelected
                          ? "bg-accent/60 text-accent-foreground font-medium"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <LayersIcon className="size-3 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">/{s.name}</span>
                      </div>
                      {isSectionSelected && (
                        <CheckIcon className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-1.5 text-[11px] text-muted-foreground/60 italic">
                  No sections in this project
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
