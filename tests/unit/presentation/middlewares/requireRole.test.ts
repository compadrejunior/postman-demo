import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireRole } from "../../../../src/presentation/http/express/middlewares/requireRole.js";
import { ForbiddenError } from "../../../../src/presentation/http/express/errors/ForbiddenError.js";

describe("requireRole", () => {
  it("calls next without an error when the role is allowed", () => {
    const req = { userRole: "admin" } as Request;
    const next = vi.fn();

    requireRole("admin")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects when the role is not allowed", () => {
    const req = { userRole: "user" } as Request;
    const next = vi.fn();

    requireRole("admin")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("rejects when no role is present on the request", () => {
    const req = {} as Request;
    const next = vi.fn();

    requireRole("admin")(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
