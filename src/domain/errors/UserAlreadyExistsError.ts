import { DomainError } from "./DomainError.js";

export class UserAlreadyExistsError extends DomainError {
  readonly code = "USER_ALREADY_EXISTS";

  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
  }
}
