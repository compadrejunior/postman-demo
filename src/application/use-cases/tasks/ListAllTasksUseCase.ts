import type { TaskOutput } from "../../dtos/TaskDtos.js";
import type { TaskRepository } from "../../ports/TaskRepository.js";
import { toTaskOutput } from "./toTaskOutput.js";

/**
 * Admin-only: lists tasks across all users. Authorization (role check) is
 * enforced by the caller — this use-case assumes it has already been granted.
 */
export class ListAllTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(): Promise<TaskOutput[]> {
    const tasks = await this.taskRepository.findAll();
    return tasks.map(toTaskOutput);
  }
}
