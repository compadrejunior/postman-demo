import { DomainError } from "./DomainError.js";

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super("Email or password is incorrect");
  }
}
