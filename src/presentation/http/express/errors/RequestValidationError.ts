import type { ZodError } from "zod";

/**
 * Presentation-layer only: wraps a Zod validation failure at the HTTP
 * boundary. Never thrown by domain/application code, which stay Zod-agnostic.
 */
export class RequestValidationError extends Error {
  constructor(readonly zodError: ZodError) {
    super("Request validation failed");
    this.name = "RequestValidationError";
  }

  get issues(): { path: string; message: string }[] {
    return this.zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
}
