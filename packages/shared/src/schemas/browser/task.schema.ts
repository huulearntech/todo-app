import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";
import { createTaskSchema as createTaskSchema_BE } from "../backend/task.schema.js";

const dateTimeSchema = z
  .object({
    date: z.iso.date(),
    time: z.iso.time(),
  })
  .transform(({ date, time }) => `${date}T${time}Z`)
  .pipe(z.iso.datetime());

export const createTaskSchema = createTaskSchema_BE.extend({
  timeRange: z
    .object({
      start: dateTimeSchema,
      end:   dateTimeSchema,
    })
    .nullable()
    .refine((data) => { // TODO: refine or superRefine?
      if (data) {
        return data.start <= data.end;
      }
      return true;
    }, {
      message: "Start date must be before end date",
    }),
})
// TODO: Do I need to pipe here?
//.pipe(createTaskSchema_BE);

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskOutput = z.output<typeof createTaskSchema>;

export const createTaskSchemaDefaultValues: CreateTaskInput = {
  title: "",
  description: "",
  timeRange: null,
  priority: TaskPriority.HIGH,
  sectionId: "", // TODO: ??
};

// TODO: fix
export const updateTaskSchema = createTaskSchema.omit({
  sectionId: true,
})

export type UpdateTaskInput  = z.input<typeof updateTaskSchema>;
export type UpdateTaskOutput = z.output<typeof updateTaskSchema>;


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  startedAt: z.coerce.date(),
  dueAt: z.coerce.date(),
}).partial();

export type TaskFilterOutput = z.infer<typeof taskFilterSchema>;