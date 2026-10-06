import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";
import { createTaskSchema as createTaskSchema_BE } from "../backend/task.schema.js";


const dateTime_ApiToForm_Codec = z.codec(
  z.object({
    date: z.iso.date(),
    time: z.iso.time(),
  }),
  z.iso.datetime(),
  {
    encode: (dateTimeString) => {
      // Convert ISO datetime string to form schema which is in local time (date and time separate).
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO datetime string: ${dateTimeString}`);
      }

      const year    = date.getFullYear();
      const month   = String(date.getMonth() + 1).padStart(2, "0");
      const day     = String(date.getDate()).padStart(2, "0");

      const hours   = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
      };
    },
    decode: ({ date, time }) => {
      // Convert form schema (date and time separate) to ISO datetime string in local time.
      const jsDate = new Date(`${date}T${time}`);
      if (isNaN(jsDate.getTime())) {
        throw new Error(`Invalid date or time: ${date} ${time}`);
      }
      return jsDate.toISOString();
    },
  }
)


const createTaskSchema = createTaskSchema_BE
  .omit({ timeRange: true }) // Not neccessary to omit here but for clarity.
  .extend({
    timeRange: z
      .object({
        start: dateTime_ApiToForm_Codec,
        end: dateTime_ApiToForm_Codec,
      })
      .nullable()
      .refine((data) => {
        if (data) {
          return data.start <= data.end;
        }
        return true;
      }, {
        message: "Start date must be before end date",
      }),
  })
  .pipe(createTaskSchema_BE);

const createTaskSchemaDefaultValues: CreateTaskInput = {
  title: "",
  description: "",
  timeRange: null,
  priority: TaskPriority.HIGH,
  sectionId: "",
  labels: [],
};

const updateTaskSchema = createTaskSchema;


type CreateTaskInput = z.input<typeof createTaskSchema>;
type CreateTaskOutput = z.output<typeof createTaskSchema>;
type UpdateTaskInput  = z.input<typeof updateTaskSchema>;
type UpdateTaskOutput = z.output<typeof updateTaskSchema>;

export {
  createTaskSchema,
  createTaskSchemaDefaultValues,
  updateTaskSchema,
}

export type {
  CreateTaskInput,
  CreateTaskOutput,
  UpdateTaskInput,
  UpdateTaskOutput
}