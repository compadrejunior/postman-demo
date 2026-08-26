import type { Task } from "../../domain/entities/Task.js";

export interface TaskRepository {
  create(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findAllByUserId(userId: string): Promise<Task[]>;
  findAll(): Promise<Task[]>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}
