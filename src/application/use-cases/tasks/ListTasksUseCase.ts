import type { ListTasksInput, TaskOutput } from "../../dtos/TaskDtos.js";
import type { TaskRepository } from "../../ports/TaskRepository.js";
import { toTaskOutput } from "./toTaskOutput.js";

export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<TaskOutput[]> {
    const tasks = await this.taskRepository.findAllByUserId(input.requestingUser.id);
    return tasks.map(toTaskOutput);
  }
}
