import type { Db } from "mongodb";
import type { Env } from "../infrastructure/config/env.js";
import { MongoTaskRepository } from "../infrastructure/database/mongo/MongoTaskRepository.js";
import { MongoUserRepository } from "../infrastructure/database/mongo/MongoUserRepository.js";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infrastructure/security/JwtTokenService.js";
import { CryptoIdGenerator } from "../infrastructure/system/CryptoIdGenerator.js";
import { SystemClock } from "../infrastructure/system/SystemClock.js";
import { LoginUserUseCase } from "../application/use-cases/auth/LoginUserUseCase.js";
import { RegisterUserUseCase } from "../application/use-cases/auth/RegisterUserUseCase.js";
import { CreateTaskUseCase } from "../application/use-cases/tasks/CreateTaskUseCase.js";
import { DeleteTaskUseCase } from "../application/use-cases/tasks/DeleteTaskUseCase.js";
import { GetTaskByIdUseCase } from "../application/use-cases/tasks/GetTaskByIdUseCase.js";
import { ListAllTasksUseCase } from "../application/use-cases/tasks/ListAllTasksUseCase.js";
import { ListTasksUseCase } from "../application/use-cases/tasks/ListTasksUseCase.js";
import { UpdateTaskUseCase } from "../application/use-cases/tasks/UpdateTaskUseCase.js";
import { AuthController } from "../presentation/http/express/controllers/AuthController.js";
import { TaskController } from "../presentation/http/express/controllers/TaskController.js";
import type { RouteControllers } from "../presentation/http/express/routes/index.js";

/**
 * Manual composition root: the only module allowed to import concrete
 * adapters from every layer and wire them together. Nothing outside this
 * file should import an infrastructure class directly.
 */
export function buildContainer(db: Db, env: Env): RouteControllers {
  const clock = new SystemClock();
  const idGenerator = new CryptoIdGenerator();
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS);
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  const userRepository = new MongoUserRepository(db);
  const taskRepository = new MongoTaskRepository(db);

  const authController = new AuthController(
    new RegisterUserUseCase(userRepository, passwordHasher, idGenerator, clock),
    new LoginUserUseCase(userRepository, passwordHasher, tokenService),
  );

  const taskController = new TaskController(
    new CreateTaskUseCase(taskRepository, idGenerator, clock),
    new ListTasksUseCase(taskRepository),
    new ListAllTasksUseCase(taskRepository),
    new GetTaskByIdUseCase(taskRepository),
    new UpdateTaskUseCase(taskRepository, clock),
    new DeleteTaskUseCase(taskRepository),
  );

  return { authController, taskController, tokenService };
}
