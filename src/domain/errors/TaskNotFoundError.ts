import { DomainError } from "./DomainError.js";

export class TaskNotFoundError extends DomainError {
  readonly code = "TASK_NOT_FOUND";

  constructor(taskId: string) {
    super(`Task "${taskId}" was not found`);
  }
}
