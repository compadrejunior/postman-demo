import { z } from "zod";
import { TASK_PRIORITIES } from "../../../../domain/value-objects/TaskPriority.js";
import { TASK_STATUSES } from "../../../../domain/value-objects/TaskStatus.js";

const taskStatusSchema = z.enum(TASK_STATUSES);
const taskPrioritySchema = z.enum(TASK_PRIORITIES);
const dueDateSchema = z
  .string()
  .datetime({ message: "dueDate must be an ISO 8601 date-time string" })
  .nullable();

export const CreateTaskRequestSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().trim().default(""),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  dueDate: dueDateSchema.default(null),
});

export const UpdateTaskRequestSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: dueDateSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field must be provided",
  });

export const TaskIdParamSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});
