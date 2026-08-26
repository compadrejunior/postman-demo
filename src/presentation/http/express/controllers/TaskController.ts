import type { Request, Response } from "express";
import type { RequestingUser } from "../../../../application/dtos/TaskDtos.js";
import type { CreateTaskUseCase } from "../../../../application/use-cases/tasks/CreateTaskUseCase.js";
import type { DeleteTaskUseCase } from "../../../../application/use-cases/tasks/DeleteTaskUseCase.js";
import type { GetTaskByIdUseCase } from "../../../../application/use-cases/tasks/GetTaskByIdUseCase.js";
import type { ListAllTasksUseCase } from "../../../../application/use-cases/tasks/ListAllTasksUseCase.js";
import type { ListTasksUseCase } from "../../../../application/use-cases/tasks/ListTasksUseCase.js";
import type { UpdateTaskUseCase } from "../../../../application/use-cases/tasks/UpdateTaskUseCase.js";

function requestingUser(req: Request): RequestingUser {
  return { id: req.userId!, role: req.userRole! };
}

export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly listAllTasksUseCase: ListAllTasksUseCase,
    private readonly getTaskByIdUseCase: GetTaskByIdUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const output = await this.createTaskUseCase.execute({
      requestingUser: requestingUser(req),
      ...req.body,
    });
    res.status(201).json(output);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const output = await this.listTasksUseCase.execute({ requestingUser: requestingUser(req) });
    res.status(200).json(output);
  };

  listAll = async (_req: Request, res: Response): Promise<void> => {
    const output = await this.listAllTasksUseCase.execute();
    res.status(200).json(output);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const output = await this.getTaskByIdUseCase.execute({
      requestingUser: requestingUser(req),
      taskId: req.params.id as string,
    });
    res.status(200).json(output);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const output = await this.updateTaskUseCase.execute({
      requestingUser: requestingUser(req),
      taskId: req.params.id as string,
      ...req.body,
    });
    res.status(200).json(output);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.deleteTaskUseCase.execute({
      requestingUser: requestingUser(req),
      taskId: req.params.id as string,
    });
    res.status(204).send();
  };
}
