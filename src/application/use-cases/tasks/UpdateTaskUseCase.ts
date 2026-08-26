import type { TaskUpdate } from "../../../domain/entities/Task.js";
import { TaskNotFoundError } from "../../../domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../domain/errors/UnauthorizedTaskAccessError.js";
import type { TaskOutput, UpdateTaskInput } from "../../dtos/TaskDtos.js";
import type { Clock } from "../../ports/Clock.js";
import type { TaskRepository } from "../../ports/TaskRepository.js";
import { toTaskOutput } from "./toTaskOutput.js";

export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateTaskInput): Promise<TaskOutput> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task) {
      throw new TaskNotFoundError(input.taskId);
    }

    if (!task.isAccessibleBy(input.requestingUser.id, input.requestingUser.role)) {
      throw new UnauthorizedTaskAccessError(input.taskId);
    }

    const update: TaskUpdate = {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    };

    const updated = task.applyUpdate(update, this.clock.now());

    await this.taskRepository.update(updated);

    return toTaskOutput(updated);
  }
}
