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

import { updateTaskSchema, type UpdateTaskInput, type UpdateTaskOutput } from "@todo/shared/browser"

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
import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskLabel } from "@/types/task-label.type";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { format, parseISO, setHours, setMinutes } from "date-fns";
import { taskService } from "@/services/task.service";

export default function TempEditTaskDialog() {
  const task = useEditTaskDialogStore((state) => state.task);
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  console.log("TempEditTaskDialog task:", task);

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
  const anchor = useComboboxAnchor();
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
  });

  const { control, handleSubmit } = useForm<UpdateTaskInput, unknown, UpdateTaskOutput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: updateTaskSchema.encode(task),
  });

  // const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
  //   control,
  //   name: "labels",
  // });

  const editTaskMutation = useMutation({
    mutationFn: (data: UpdateTaskOutput) => taskService.updateTask(task.id, data),
    onMutate: async (data, context) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await context.client.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = context.client.getQueryData<Task[]>(["tasks"]);

      // Optimistically update to the new value
      context.client.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, ...data } : t)) ?? []
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (_err, _data, onMutateResult, context) => {
      // Rollback to the previous value
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData<Task[]>(["tasks"], onMutateResult.previousTasks);
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      // Always refetch after error or success:
      context.client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });


  const onSubmit = (data: UpdateTaskOutput) => editTaskMutation.mutate(data, {
    onSuccess: () => {
      toast.add({
        title: "Task updated",
        description: "The task was updated successfully.",
        type: "success",
      });
    },
    onError: () => {
      toast.add({
        title: "Error updating task",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSettled: () => {
      setTask(null);
    }
  });

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

        {/* <Controller
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
        /> */}

        <Controller
          name="timeRange"
          control={control}
          render={({ field, fieldState }) => {
            return (
              <Field>
                <FieldLabel htmlFor="timeRange">Time Range</FieldLabel>
                <Select
                  value={field.value ? "custom" : "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      field.onChange(null);
                    } else if (value === "custom") {
                      const now = new Date();
                      const start = setHours(setMinutes(now, 0), 9); // 9:00 AM today
                      const end = setHours(setMinutes(now, 0), 17); // 5:00 PM today
                      field.onChange({
                        start: { date: format(start, "yyyy-MM-dd"), time: format(start, "HH:mm") },
                        end: { date: format(end, "yyyy-MM-dd"), time: format(end, "HH:mm") },
                      });
                    }
                  }}
                  id="timeRange"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {field.value && (
                  // TODO: labels and stuffs
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger render={
                          <Button variant="outline"
                            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }>
                          <CalendarIcon />
                          {field.value.start.date || "Pick start date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value.start.date ? parseISO(field.value.start.date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange({
                                  ...field.value,
                                  start: { date: format(date, "yyyy-MM-dd"), time: field.value!.start.time },
                                });
                              } else {
                                field.onChange({
                                  ...field.value,
                                  start: { date: "", time: field.value!.start.time },
                                });
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={field.value.start.time}
                        onChange={(e) => {
                          field.onChange({
                            ...field.value,
                            start: { date: field.value!.start.date, time: e.target.value },
                          });
                        }}
                      />

                    </div>


                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger render={
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }>
                          <CalendarIcon />
                          {field.value.end.date || "Pick end date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value.end.date ? parseISO(field.value.end.date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange({
                                  ...field.value,
                                  end: { date: format(date, "yyyy-MM-dd"), time: field.value!.end.time }
                                });
                              } else {
                                field.onChange({
                                  ...field.value,
                                  end: { date: "", time: field.value!.end.time },
                                });
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={field.value.end.time}
                        onChange={(e) => {
                          field.onChange({
                            ...field.value,
                            end: { date: field.value!.end.date, time: e.target.value },
                          });
                        }}
                      />

                    </div>
                  </div>
                )}

                {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
              </Field>
            )
          }}
        />
      </FieldGroup>
    </form>
  )
}


              