import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authMiddleware } from "../../../../src/presentation/http/express/middlewares/authMiddleware.js";
import { UnauthenticatedError } from "../../../../src/presentation/http/express/errors/UnauthenticatedError.js";
import { FakeTokenService } from "../../../unit/_fakes/FakeTokenService.js";

function buildReq(header: string | undefined): Request {
  return { header: () => header } as unknown as Request;
}

describe("authMiddleware", () => {
  const middleware = authMiddleware(new FakeTokenService());

  it("calls next with the user id and role on a valid token", () => {
    const req = buildReq("Bearer token:user-1:admin");
    const next = vi.fn() as NextFunction;

    middleware(req, {} as Response, next);

    expect(req.userId).toBe("user-1");
    expect(req.userRole).toBe("admin");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a missing authorization header", () => {
    const req = buildReq(undefined);
    const next = vi.fn() as NextFunction;

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });

  it("rejects a header without the Bearer prefix", () => {
    const req = buildReq("token:user-1:user");
    const next = vi.fn() as NextFunction;

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });

  it("rejects an invalid token", () => {
    const req = buildReq("Bearer garbage");
    const next = vi.fn() as NextFunction;

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });
});
