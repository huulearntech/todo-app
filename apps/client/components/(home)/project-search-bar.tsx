"use client"

// NOTE: Maybe this search bar can also use the quick command system like the create project form

import { ReactNode, useState } from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/reui/autocomplete"

import { LoaderCircleIcon } from 'lucide-react'
import { useQuery } from "@tanstack/react-query"
import { ProjectResponseDto } from "@todo/shared"
import { projectService } from "@/services/project.service"
import Link from "next/link"

export default function ProjectSearchBar() {
  const [searchValue, setSearchValue] = useState("")

  const [debouncedSearchValue] = useDebouncedValue(searchValue, { wait: 300 })

  const { data: searchResults, isPending, error } = useQuery<ProjectResponseDto[], Error>({
    queryKey: ["search-projects", debouncedSearchValue],
    queryFn: async () => {
      if (!debouncedSearchValue) return []
      const results = await projectService.getMyProjects({ name: debouncedSearchValue });
      return results
    },
    enabled: debouncedSearchValue.trim().length > 0, // Only run the query if the search value is not empty
  })

  let status: ReactNode = ""

  if (isPending) {
    status = (
      <div className="flex items-center gap-2">
        <LoaderCircleIcon  className="size-4 animate-spin" />
        Searching projects...
      </div>
    )
  } else if (error) {
    status = error.message
  } else if (searchResults.length === 0 && searchValue) {
    status = `No projects found for "${searchValue}"`
  } else if (searchResults.length > 0) {
    status = `${searchResults.length} project${searchResults.length === 1 ? "" : "s"} found`
  } else if (!searchValue) {
    status = "Start typing to search projects..."
  }

  const shouldRenderPopup = searchValue.trim() !== ""

  return (
    <div className="w-full max-w-xs">
      <Autocomplete
        items={searchResults}
        value={searchValue}
        onValueChange={setSearchValue}
        itemToStringValue={(item: ProjectResponseDto) => item.name}
        filter={null}
      >
        <AutocompleteInput placeholder="Search projects..." showClear />
        {shouldRenderPopup && (
          <AutocompleteContent>
            <AutocompleteStatus>{status}</AutocompleteStatus>
            <AutocompleteList>
              {(project: ProjectResponseDto) => (
                <AutocompleteItem
                  key={project.id}
                  value={project}
                  className="rounded-lg"
                  render={<Link href={`/projects/${project.id}`} className="w-full" />}
                >
                  {project.name}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        )}
      </Autocomplete>
    </div>
  )
}