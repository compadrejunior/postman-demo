import type { TaskPriority } from "../../domain/value-objects/TaskPriority.js";
import type { TaskStatus } from "../../domain/value-objects/TaskStatus.js";
import type { UserRole } from "../../domain/value-objects/UserRole.js";

export interface RequestingUser {
  id: string;
  role: UserRole;
}

export interface TaskOutput {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  requestingUser: RequestingUser;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
}

export interface UpdateTaskInput {
  requestingUser: RequestingUser;
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface TaskIdInput {
  requestingUser: RequestingUser;
  taskId: string;
}

export interface ListTasksInput {
  requestingUser: RequestingUser;
}
