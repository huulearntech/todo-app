"use client"

// NOTE: Maybe this search bar can also use the quick command system like the create task form

import { ReactNode, useEffect, useState } from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from "@/components/reui/autocomplete"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { LoaderCircleIcon } from 'lucide-react'
import { useQuery } from "@tanstack/react-query"
import { Task } from "@/types/task.type"
import { taskService } from "@/services/task.service"

export default function TaskSearchBar() {
  const [searchValue, setSearchValue] = useState("")

  const [debouncedSearchValue] = useDebouncedValue(searchValue, { wait: 300 })

  const { data: searchResults, isPending, error } = useQuery<Task[], Error>({
    queryKey: ["search-tasks", debouncedSearchValue],
    queryFn: async () => {
      if (!debouncedSearchValue) return []
      const results = await taskService.getMyTasks({ title: debouncedSearchValue });
      return results
    },
    enabled: debouncedSearchValue.trim().length > 0, // Only run the query if the search value is not empty
  })

  let status: ReactNode = ""

  if (isPending) {
    status = (
      <div className="flex items-center gap-2">
        <LoaderCircleIcon  className="size-4 animate-spin" />
        Searching tasks...
      </div>
    )
  } else if (error) {
    status = error.message
  } else if (searchResults.length === 0 && searchValue) {
    status = `No tasks found for "${searchValue}"`
  } else if (searchResults.length > 0) {
    status = `${searchResults.length} task${searchResults.length === 1 ? "" : "s"} found`
  } else if (!searchValue) {
    status = "Start typing to search tasks..."
  }

  const shouldRenderPopup = searchValue.trim() !== ""

  return (
    <div className="w-full max-w-xs">
      <Autocomplete
        items={searchResults}
        value={searchValue}
        onValueChange={setSearchValue}
        itemToStringValue={(item: unknown) => (item as Task).title}
        filter={null}
      >
        <AutocompleteInput placeholder="Search tasks..." showClear />
        {shouldRenderPopup && (
          <AutocompleteContent>
            <AutocompleteStatus>{status}</AutocompleteStatus>
            <AutocompleteList>
              {(task: Task) => (
                <AutocompleteItem
                  key={task.id}
                  value={task}
                  className="rounded-lg"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* <Avatar className="size-9">
                      <AvatarImage
                        src={developer.avatar}
                        alt={developer.name}
                      />
                      <AvatarFallback>
                        {developer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar> */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {task.title}
                      </div>
                      {/* <div className="text-muted-foreground truncate text-sm">
                        {developer.role} • {developer.location}
                      </div> */}
                    </div>
                  </div>
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        )}
      </Autocomplete>
    </div>
  )
}