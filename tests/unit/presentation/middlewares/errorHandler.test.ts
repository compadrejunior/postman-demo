import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { z } from "zod";
import { errorHandler } from "../../../../src/presentation/http/express/middlewares/errorHandler.js";
import { RequestValidationError } from "../../../../src/presentation/http/express/errors/RequestValidationError.js";
import { ForbiddenError } from "../../../../src/presentation/http/express/errors/ForbiddenError.js";
import { UnauthenticatedError } from "../../../../src/presentation/http/express/errors/UnauthenticatedError.js";
import { InvalidCredentialsError } from "../../../../src/domain/errors/InvalidCredentialsError.js";
import { TaskNotFoundError } from "../../../../src/domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../../src/domain/errors/UnauthorizedTaskAccessError.js";
import { UserAlreadyExistsError } from "../../../../src/domain/errors/UserAlreadyExistsError.js";

function buildRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response & { status: typeof status };
}

describe("errorHandler", () => {
  it("maps a RequestValidationError to 400 with issue details", () => {
    const zodError = z.object({ name: z.string() }).safeParse({}).error!;
    const res = buildRes();

    errorHandler(new RequestValidationError(zodError), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps an UnauthenticatedError to 401", () => {
    const res = buildRes();
    errorHandler(new UnauthenticatedError(), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("maps a ForbiddenError to 403", () => {
    const res = buildRes();
    errorHandler(new ForbiddenError(), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each([
    [new InvalidCredentialsError(), 401],
    [new UnauthorizedTaskAccessError("task-1"), 403],
    [new TaskNotFoundError("task-1"), 404],
    [new UserAlreadyExistsError("a@example.com"), 409],
  ] as const)("maps %s to %i", (error, expectedStatus) => {
    const res = buildRes();
    errorHandler(error, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
  });

  it("falls back to 500 for unknown errors", () => {
    const res = buildRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("boom"), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});
