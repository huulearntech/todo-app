"use client"

// NOTE: Maybe this search bar can also use the quick command system like the create task form

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

import { LoaderCircleIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { TaskResponseDto as Task } from "@todo/shared"
import { taskService } from "@/features/tasks/services/task.service"
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider"
import { cn } from "@/lib/utils"

export default function TaskSearchBar({ className }: { className?: string }) {
  const [searchValue, setSearchValue] = useState("")

  const setTask = useEditTaskDialogStore((state) => state.setTask)
  const setDialogIsOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen)

  const [debouncedSearchValue] = useDebouncedValue(searchValue, { wait: 300 })

  const { data: searchResults, isPending, error } = useQuery<Task[], Error>({
    queryKey: ["search-tasks", debouncedSearchValue],
    queryFn: async () => {
      if (!debouncedSearchValue) return []
      const results = await taskService.getMyTasks({ title: debouncedSearchValue })
      return results
    },
    enabled: debouncedSearchValue.trim().length > 0,
  })

  let status: ReactNode = ""

  if (isPending) {
    status = (
      <div className="flex items-center gap-2">
        <LoaderCircleIcon className="size-4 animate-spin" />
        Searching tasks...
      </div>
    )
  } else if (error) {
    status = error.message
  } else if (searchResults && searchResults.length === 0 && searchValue) {
    status = `No tasks found for "${searchValue}"`
  } else if (searchResults && searchResults.length > 0) {
    status = `${searchResults.length} task${searchResults.length === 1 ? "" : "s"} found`
  } else if (!searchValue) {
    status = "Start typing to search tasks..."
  }

  const shouldRenderPopup = searchValue.trim() !== ""

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <Autocomplete
        items={searchResults}
        value={searchValue}
        onValueChange={setSearchValue}
        itemToStringValue={(item: unknown) => (item as Task).title}
        filter={null}
      >
        <AutocompleteInput
          size="sm"
          placeholder="Search tasks..."
          showClear
          className="h-7 text-xs bg-muted/30 border-border/60"
        />
        {shouldRenderPopup && (
          <AutocompleteContent className="rounded-xl shadow-xl border-border/80 bg-popover">
            <AutocompleteStatus>{status}</AutocompleteStatus>
            <AutocompleteList>
              {(task: Task) => (
                <AutocompleteItem
                  key={task.id}
                  value={task}
                  className="rounded-lg cursor-pointer text-xs py-1.5 px-2 hover:bg-muted/50"
                  onClick={() => {
                    setTask(task)
                    setDialogIsOpen(true)
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="min-w-0 flex-1 truncate font-medium">
                      {task.title}
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