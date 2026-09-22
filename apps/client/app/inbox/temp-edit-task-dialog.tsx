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
import { UpdateTaskInput, updateTaskSchema, type UpdateTaskDto } from "@todo/shared"

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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

import { format } from "date-fns";
import { taskService } from "@/services/task.service";

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

  const { control, handleSubmit, reset } = useForm<UpdateTaskInput, unknown, UpdateTaskDto>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      // labels: task.labels.map(label => ({ id: label.id })),
      startedAt: task.startedAt,
      dueAt: task.dueAt,
      labels: []
    },
  });

  const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
    control,
    name: "labels",
  });

  const anchor = useComboboxAnchor();

  // TODO: need to reset the query. and may be use optimistic update also
  const onSubmit = async (data: UpdateTaskDto) => {
    await taskService.updateTask(task.id, data);
  }

  return (
    <form
      id="edit-task-form"
      onSubmit={handleSubmit(onSubmit)}>
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

        <Controller
          name="startedAt"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="startedAt">Start</FieldLabel>
              <Popover>
                <PopoverTrigger render={
                  <Button variant="outline"
                    data-empty={!field.value}
                    className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  />
                }>
                  <CalendarIcon />
                  {field.value ? format(field.value as Date, "PPP") : <span>Pick start date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value as Date ?? undefined}
                    onSelect={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
            </Field>
          )}
        />

        <Controller
          name="dueAt"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="dueAt">Due</FieldLabel>
              <Popover>
                <PopoverTrigger render={
                  <Button variant="outline"
                    data-empty={!field.value}
                    className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  />
                }>
                  <CalendarIcon />
                  {field.value ? format(field.value as Date, "PPP") : <span>Pick due date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value as Date ?? undefined}
                    onSelect={field.onChange}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  )
}


              