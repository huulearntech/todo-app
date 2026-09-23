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

// TODO: separate the schema into the root and "/browser" like other libraries.
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
import { useQuery } from "@tanstack/react-query";
import { TaskLabel } from "@/types/task-label.type";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

import { format, parseISO, setHours, setMinutes } from "date-fns";
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

  const { control, handleSubmit, reset } = useForm<UpdateTaskInput, unknown, UpdateTaskOutput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      timeRange: task.timeRange,
      // labels: []
    },
  });

  // const { fields: labelFields, append: appendLabel, remove: removeLabel } = useFieldArray({
  //   control,
  //   name: "labels",
  // });

  const anchor = useComboboxAnchor();

  // TODO: need to reset the query. and may be use optimistic update also
  const onSubmit = async (data: UpdateTaskOutput) => {
    console.log("onSubmit called with data:", data);
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

        {/** TODO: add a select to select due date or not */}
        { task.timeRange &&
        <Controller
          name="timeRange.start.date"
          control={control}
          render={({ field, fieldState }) => {
            const dateValue = parseISO(field.value);

            return (
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
                    {field.value ? format(dateValue, "PPP") : <span>Pick start date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      required
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                        } else {
                          field.onChange(""); // NOTE: empty string or undefined?
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
              </Field>

            )
          }}
        />
        }

        {/* <Controller
          name="timeRange.end.date"
          control={control}
          render={({ field, fieldState }) => {
            const dateValue = parseISO(field.value);

            return (
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
                    {field.value ? format(dateValue, "PPP") : <span>Pick due date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                        } else {
                          field.onChange(""); // NOTE: empty string or undefined?
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
              </Field>
            )
          }}
        /> */}
      </FieldGroup>
    </form>
  )
}


              