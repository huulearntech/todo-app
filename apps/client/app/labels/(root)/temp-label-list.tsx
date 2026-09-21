"use client";

import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { TagIcon } from "lucide-react";

import Dialog_AddLabel from "./add-label-form";
import Link from "next/link";
import { Badge } from "@/components/reui/badge";
import { useState } from "react";
import { TaskLabel } from "@/types/task-label.type";
import Dialog_EditLabel from "./temp-edit-label-form";

export default function TempTaskLabelList() {
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["labels"], // TODO: centralize query keys and mutation management.
    queryFn: async () => {
      const response = await taskLabelService.getMyTaskLabels(); // TODO: pagination
      return response.data;
    },
  });

  const [label, setLabel] = useState<TaskLabel | null>(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-4">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <h1>Labels</h1>
          <Badge variant="outline">{labels.length}</Badge>
        </div>
        <Dialog_AddLabel />
      </div>
      <ul className="flex flex-col gap-2">
        {labels.map((label) => (
          <li key={label.id}>
            <Item
              variant="outline"
              data-label-id={label.id}
              render={<button />}
              onClick={() => setLabel(label)}
              className="cursor-pointer"
            >
              <ItemMedia>
                <TagIcon />
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle>{label.name}</ItemTitle>
                <ItemDescription>{label.description}</ItemDescription>
              </ItemContent>
            </Item>
          </li>
        ))}
      </ul>
      <Dialog_EditLabel label={label} setLabel={setLabel} />
    </div>
  );
}
