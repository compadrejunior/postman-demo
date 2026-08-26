import { TaskNotFoundError } from "../../../domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../domain/errors/UnauthorizedTaskAccessError.js";
import type { TaskIdInput, TaskOutput } from "../../dtos/TaskDtos.js";
import type { TaskRepository } from "../../ports/TaskRepository.js";
import { toTaskOutput } from "./toTaskOutput.js";

export class GetTaskByIdUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: TaskIdInput): Promise<TaskOutput> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task) {
      throw new TaskNotFoundError(input.taskId);
    }

    if (!task.isAccessibleBy(input.requestingUser.id, input.requestingUser.role)) {
      throw new UnauthorizedTaskAccessError(input.taskId);
    }

    return toTaskOutput(task);
  }
}
