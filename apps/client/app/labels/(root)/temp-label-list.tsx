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
import { Pencil, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

import Dialog_AddLabel from "./add-label-form";
import Link from "next/link";

export default function TempTaskLabelList() {
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["labels"], // TODO: centralize query keys and mutation management.
    queryFn: async () => {
      const response = await taskLabelService.getMyTaskLabels(); // TODO: pagination
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2>Temporary Label List</h2>
        <Dialog_AddLabel />
      </div>
      <div className="my-4">
        <p>Below is a temporary list of labels fetched from the server.</p>
      </div>
      <div className="mb-4">
        <p>Total Labels: {labels.length}</p>
      </div>
      <ul>
        {labels.map((label) => (
          <Item key={label.id} render={<Link href={`/labels/${label.id}`} />}>
            <ItemMedia>
              <Tag className="fill" />
            </ItemMedia>
            <ItemContent className="gap-1">
              <ItemTitle>{label.name}</ItemTitle>
              <ItemDescription>{label.description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Pencil />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ul>
    </div>
  );
}
