import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import type { UserRole } from "../../../../domain/value-objects/UserRole.js";

/**
 * Route-level access control for endpoints that aren't scoped to a single
 * resource (e.g. "list every task in the system"), as opposed to per-resource
 * ownership checks, which are enforced by the domain/application layer.
 */
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
