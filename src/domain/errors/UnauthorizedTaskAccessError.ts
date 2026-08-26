import { DomainError } from "./DomainError.js";

export class UnauthorizedTaskAccessError extends DomainError {
  readonly code = "UNAUTHORIZED_TASK_ACCESS";

  constructor(taskId: string) {
    super(`You are not allowed to access task "${taskId}"`);
  }
}
