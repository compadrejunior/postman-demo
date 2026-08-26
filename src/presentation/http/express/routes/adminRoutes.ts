import { Router } from "express";
import type { TokenService } from "../../../../application/ports/TokenService.js";
import { asyncHandler } from "../asyncHandler.js";
import type { TaskController } from "../controllers/TaskController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/requireRole.js";

export function adminRoutes(controller: TaskController, tokenService: TokenService): Router {
  const router = Router();

  router.use(authMiddleware(tokenService));
  router.get("/tasks", requireRole("admin"), asyncHandler(controller.listAll));

  return router;
}
