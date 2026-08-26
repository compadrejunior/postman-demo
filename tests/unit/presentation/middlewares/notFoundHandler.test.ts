import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { notFoundHandler } from "../../../../src/presentation/http/express/middlewares/notFoundHandler.js";

describe("notFoundHandler", () => {
  it("responds with a 404 JSON error", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    notFoundHandler({} as Request, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } });
  });
});
