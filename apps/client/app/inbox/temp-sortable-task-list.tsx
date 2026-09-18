"use client";

import dynamic from "next/dynamic"
import { useState } from "react"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

import { Badge } from "@/components/reui/badge"
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
  type SortableCommitMeta,
} from "@/components/reui/sortable"
import { toast } from "@/components/ui/toast"
import { GripVerticalIcon } from 'lucide-react'

import { taskService } from "@/services/task.service"
import { Checkbox } from "@/components/ui/checkbox";

type Item = {
  id: string;
  title: string;
};

type ReorderPayload = {
  itemId: string;
  prevId?: string;
  nextId?: string;
};

const useItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: () =>
      taskService
        .getMyTasks({
          projectId: "9da6157d-8d63-4470-bcdd-f2b5c9064b10",
        })
        .then((tasks) => tasks.map((task) => ({ id: task.id, title: task.title }))),
  });
};

function buildReorderPayload(previousIds: string[], nextIds: string[]): ReorderPayload | null {
  const firstDiffIndex = previousIds.findIndex((id, index) => id !== nextIds[index]);
  if (firstDiffIndex === -1) return null;

  const movedItemId =
    previousIds[firstDiffIndex] === nextIds[firstDiffIndex + 1]
      ? nextIds[firstDiffIndex] // moved up
      : previousIds[firstDiffIndex]; // moved down

  const newIndex = nextIds.indexOf(movedItemId);

  return {
    itemId: movedItemId,
    prevId: newIndex > 0 ? nextIds[newIndex - 1] : undefined,
    nextId: newIndex < nextIds.length - 1 ? nextIds[newIndex + 1] : undefined,
  };
}

function moveItemByNeighbors(items: Item[], payload: ReorderPayload): Item[] {
  const next = [...items];
  console.log("moveItemByNeighbors items:", next.map((item) => item.id));

  const currentIndex = next.findIndex((item) => item.id === payload.itemId);

  if (currentIndex === -1) return next;

  const [moved] = next.splice(currentIndex, 1);

  let insertIndex = next.length;

  if (payload.nextId) {
    const nextIndex = next.findIndex((item) => item.id === payload.nextId);
    if (nextIndex !== -1) insertIndex = nextIndex;
  } else if (payload.prevId) {
    const prevIndex = next.findIndex((item) => item.id === payload.prevId);
    if (prevIndex !== -1) insertIndex = prevIndex + 1;
  }

  next.splice(insertIndex, 0, moved);

  console.log("moveItemByNeighbors result:", next.map((item) => item.id));
  return next;
}

function TempSortableTaskList() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useItems();
  const [activeOrder, setActiveOrder] = useState<string[] | null>(null);

  const { mutate } = useMutation({
    mutationFn: async ({ itemId, prevId, nextId }: ReorderPayload) => {
      await taskService.updateTaskOrder(itemId, prevId, nextId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData<Item[]>(["items"]);
      return { previousItems };
    },
    onError: (_err, _payload, context) => {
      queryClient.setQueryData(["items"], context?.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const displayItems = activeOrder
    ? [...tasks].sort((a, b) => activeOrder.indexOf(a.id) - activeOrder.indexOf(b.id))
    : tasks;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-xl p-6">
      <Sortable
        value={displayItems.map((item) => item.id)}
        onValueChange={(newIds) => setActiveOrder(newIds)}
        onValueCommit={(finalIds) => {
          const previousIds = tasks.map((item) => item.id);
          const payload = buildReorderPayload(previousIds, finalIds);

          if (!payload) {
            setActiveOrder(null);
            return;
          }

          queryClient.setQueryData<Item[]>(["items"], (old = []) =>
            moveItemByNeighbors(old, payload)
          );

          setActiveOrder(null);
          mutate(payload);
        }}
        getItemValue={(item) => item}
        strategy="vertical"
        className="space-y-2"
      >
        {displayItems.map((item) => (
          <SortableItem key={item.id} value={item.id}>
            <div className="bg-background border-border flex items-center gap-3 rounded-md border p-3">
              <SortableItemHandle className="text-muted-foreground hover:text-foreground">
                <GripVerticalIcon className="h-4 w-4" />
              </SortableItemHandle>
              <Checkbox className="size-5 rounded-full border-blue-500 data-checked:bg-blue-500 data-checked:border-blue-500" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.title}
              </span>
            </div>
          </SortableItem>
        ))}
      </Sortable>
    </div>
  );
}

export default dynamic(() => Promise.resolve(TempSortableTaskList), {
  ssr: false,
});