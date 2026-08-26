import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { RequestValidationError } from "./errors/RequestValidationError.js";

type RequestPart = "body" | "params" | "query";

export function validateRequest(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new RequestValidationError(result.error));
      return;
    }
    req[part] = result.data;
    next();
  };
}
