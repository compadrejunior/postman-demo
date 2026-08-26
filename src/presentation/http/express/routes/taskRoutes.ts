import { Router } from "express";
import type { TokenService } from "../../../../application/ports/TokenService.js";
import { asyncHandler } from "../asyncHandler.js";
import type { TaskController } from "../controllers/TaskController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { CreateTaskRequestSchema, TaskIdParamSchema, UpdateTaskRequestSchema } from "../schemas/taskSchemas.js";
import { validateRequest } from "../validateRequest.js";

export function taskRoutes(controller: TaskController, tokenService: TokenService): Router {
  const router = Router();

  router.use(authMiddleware(tokenService));

  router.post("/", validateRequest(CreateTaskRequestSchema), asyncHandler(controller.create));
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", validateRequest(TaskIdParamSchema, "params"), asyncHandler(controller.getById));
  router.patch(
    "/:id",
    validateRequest(TaskIdParamSchema, "params"),
    validateRequest(UpdateTaskRequestSchema),
    asyncHandler(controller.update),
  );
  router.delete("/:id", validateRequest(TaskIdParamSchema, "params"), asyncHandler(controller.remove));

  return router;
}
