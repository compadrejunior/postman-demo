import type { TaskRepository } from "../../../src/application/ports/TaskRepository.js";
import type { Task } from "../../../src/domain/entities/Task.js";

export class FakeTaskRepository implements TaskRepository {
  private readonly tasksById = new Map<string, Task>();

  async create(task: Task): Promise<void> {
    this.tasksById.set(task.id, task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasksById.get(id) ?? null;
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    return [...this.tasksById.values()].filter((task) => task.userId === userId);
  }

  async findAll(): Promise<Task[]> {
    return [...this.tasksById.values()];
  }

  async update(task: Task): Promise<void> {
    this.tasksById.set(task.id, task);
  }

  async delete(id: string): Promise<void> {
    this.tasksById.delete(id);
  }
}
