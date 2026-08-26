import type { Task } from "../../../domain/entities/Task.js";
import type { TaskOutput } from "../../dtos/TaskDtos.js";

export function toTaskOutput(task: Task): TaskOutput {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
