"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";

import { Task } from "@/types/task.type";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";

import { useForm, Controller, useFieldArray } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateTaskSchema, type UpdateTaskDto } from "@todo/shared"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { taskLabelService } from "@/services/task-label.service";
import { useQuery } from "@tanstack/react-query";
import { TaskLabel } from "@/types/task-label.type";

export default function TempEditTaskDialog() {
  const task = useEditTaskDialogStore((state) => state.task);
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  if (!task) {
    return null;
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => { if (!open) setTask(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> {task.title} </DialogTitle>
          <DialogDescription> {task.description} </DialogDescription>
        </DialogHeader>

        <EditTaskForm task={task} />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setTask(null)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-task-form">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskForm({ task }: { task: Task }) {
  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
  });

  const { control, handleSubmit, reset } = useForm<UpdateTaskDto>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      // labels: task.labels.map(label => ({ id: label.id })),
      labels: []
    },
  });

  const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
    control,
    name: "labels",
  });

  const anchor = useComboboxAnchor();

  return (
    <form
      id="edit-task-form"
      onSubmit={handleSubmit((data) => {
        console.log("Form submitted with data:", data);
      })}>
      <FieldGroup>
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input {...field} id="title" placeholder="Task title" />
              {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea {...field} id="description" placeholder="Task description" />
              {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
            </Field>
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="priority">Priority</FieldLabel>
              <Select {...field} value={field.value} onValueChange={field.onChange} id="priority">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
            </Field>
          )}
        />

      <Controller
        name="labels"
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="labels-combobox">Labels</FieldLabel>
            
            <Combobox
              id="labels-combobox"
              multiple
              items={labelFields}
              value={field.value}
              onValueChange={field.onChange}
              itemToStringValue={(item) => item.id}
            >
              <ComboboxChips ref={anchor}>
                <ComboboxValue>
                  {field.value.map((fieldItem, index) => (
                    <ComboboxChip key={`${fieldItem.id}`}>
                      {labels.find(label => label.id === fieldItem.id)?.name || "Unknown Label"}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder="Find labels..." />
                </ComboboxValue>
              </ComboboxChips>

              <ComboboxEmpty>No labels found</ComboboxEmpty>
              
              <ComboboxContent anchor={anchor}>
                <ComboboxList>
                  {labels.map((label) => (
                    <ComboboxItem
                      key={`${label.id}`}
                      value={label}
                    >
                      {label.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      </FieldGroup>
    </form>
  )
}


              