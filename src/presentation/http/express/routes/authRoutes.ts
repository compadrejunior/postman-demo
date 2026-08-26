import { Router } from "express";
import { asyncHandler } from "../asyncHandler.js";
import type { AuthController } from "../controllers/AuthController.js";
import { LoginRequestSchema, RegisterRequestSchema } from "../schemas/authSchemas.js";
import { validateRequest } from "../validateRequest.js";

export function authRoutes(controller: AuthController): Router {
  const router = Router();

  router.post("/register", validateRequest(RegisterRequestSchema), asyncHandler(controller.register));
  router.post("/login", validateRequest(LoginRequestSchema), asyncHandler(controller.login));

  return router;
}
