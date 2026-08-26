import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../../../../domain/errors/DomainError.js";
import { InvalidCredentialsError } from "../../../../domain/errors/InvalidCredentialsError.js";
import { TaskNotFoundError } from "../../../../domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../../domain/errors/UnauthorizedTaskAccessError.js";
import { UserAlreadyExistsError } from "../../../../domain/errors/UserAlreadyExistsError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { RequestValidationError } from "../errors/RequestValidationError.js";
import { UnauthenticatedError } from "../errors/UnauthenticatedError.js";

const STATUS_BY_ERROR = new Map<new (...args: never[]) => DomainError, number>([
  [InvalidCredentialsError, 401],
  [UnauthorizedTaskAccessError, 403],
  [TaskNotFoundError, 404],
  [UserAlreadyExistsError, 409],
]);

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof RequestValidationError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: err.message, issues: err.issues } });
    return;
  }

  if (err instanceof UnauthenticatedError) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: err.message } });
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: { code: "FORBIDDEN", message: err.message } });
    return;
  }

  if (err instanceof DomainError) {
    const status = STATUS_BY_ERROR.get(err.constructor as new (...args: never[]) => DomainError) ?? 400;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" } });
}
