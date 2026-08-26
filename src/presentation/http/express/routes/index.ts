import { Router } from "express";
import type { TokenService } from "../../../../application/ports/TokenService.js";
import type { AuthController } from "../controllers/AuthController.js";
import type { TaskController } from "../controllers/TaskController.js";
import { adminRoutes } from "./adminRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { taskRoutes } from "./taskRoutes.js";

export interface RouteControllers {
  authController: AuthController;
  taskController: TaskController;
  tokenService: TokenService;
}

export function apiRoutes({ authController, taskController, tokenService }: RouteControllers): Router {
  const router = Router();

  router.use("/auth", authRoutes(authController));
  router.use("/tasks", taskRoutes(taskController, tokenService));
  router.use("/admin", adminRoutes(taskController, tokenService));

  return router;
}
