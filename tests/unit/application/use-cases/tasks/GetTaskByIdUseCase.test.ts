import { beforeEach, describe, expect, it } from "vitest";
import { GetTaskByIdUseCase } from "../../../../../src/application/use-cases/tasks/GetTaskByIdUseCase.js";
import { Task } from "../../../../../src/domain/entities/Task.js";
import { TaskNotFoundError } from "../../../../../src/domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../../../src/domain/errors/UnauthorizedTaskAccessError.js";
import { FakeTaskRepository } from "../../../_fakes/FakeTaskRepository.js";

describe("GetTaskByIdUseCase", () => {
  let taskRepository: FakeTaskRepository;
  let useCase: GetTaskByIdUseCase;

  beforeEach(async () => {
    taskRepository = new FakeTaskRepository();
    useCase = new GetTaskByIdUseCase(taskRepository);

    await taskRepository.create(
      Task.create({
        id: "task-1",
        userId: "user-1",
        title: "Write tests",
        description: "",
        status: "todo",
        priority: "low",
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it("returns the task for its owner", async () => {
    const output = await useCase.execute({ requestingUser: { id: "user-1", role: "user" }, taskId: "task-1" });
    expect(output.id).toBe("task-1");
  });

  it("returns the task for an admin", async () => {
    const output = await useCase.execute({ requestingUser: { id: "user-2", role: "admin" }, taskId: "task-1" });
    expect(output.id).toBe("task-1");
  });

  it("throws TaskNotFoundError for an unknown id", async () => {
    await expect(
      useCase.execute({ requestingUser: { id: "user-1", role: "user" }, taskId: "missing" }),
    ).rejects.toThrow(TaskNotFoundError);
  });

  it("throws UnauthorizedTaskAccessError for another regular user", async () => {
    await expect(
      useCase.execute({ requestingUser: { id: "user-2", role: "user" }, taskId: "task-1" }),
    ).rejects.toThrow(UnauthorizedTaskAccessError);
  });
});
