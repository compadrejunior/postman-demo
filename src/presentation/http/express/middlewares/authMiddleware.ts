import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { TokenService } from "../../../../application/ports/TokenService.js";
import { UnauthenticatedError } from "../errors/UnauthenticatedError.js";

const BEARER_PREFIX = "Bearer ";

export function authMiddleware(tokenService: TokenService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header("authorization");
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      next(new UnauthenticatedError());
      return;
    }

    const token = header.slice(BEARER_PREFIX.length);
    const payload = tokenService.verify(token);
    if (!payload) {
      next(new UnauthenticatedError());
      return;
    }

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  };
}
