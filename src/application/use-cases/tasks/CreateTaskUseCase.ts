import { Task } from "../../../domain/entities/Task.js";
import type { CreateTaskInput, TaskOutput } from "../../dtos/TaskDtos.js";
import type { Clock } from "../../ports/Clock.js";
import type { IdGenerator } from "../../ports/IdGenerator.js";
import type { TaskRepository } from "../../ports/TaskRepository.js";
import { toTaskOutput } from "./toTaskOutput.js";

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateTaskInput): Promise<TaskOutput> {
    const now = this.clock.now();

    const task = Task.create({
      id: this.idGenerator.generate(),
      userId: input.requestingUser.id,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
    });

    await this.taskRepository.create(task);

    return toTaskOutput(task);
  }
}
