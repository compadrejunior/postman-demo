import { beforeEach, describe, expect, it } from "vitest";
import { DeleteTaskUseCase } from "../../../../../src/application/use-cases/tasks/DeleteTaskUseCase.js";
import { Task } from "../../../../../src/domain/entities/Task.js";
import { TaskNotFoundError } from "../../../../../src/domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../../../src/domain/errors/UnauthorizedTaskAccessError.js";
import { FakeTaskRepository } from "../../../_fakes/FakeTaskRepository.js";

describe("DeleteTaskUseCase", () => {
  let taskRepository: FakeTaskRepository;
  let useCase: DeleteTaskUseCase;

  beforeEach(async () => {
    taskRepository = new FakeTaskRepository();
    useCase = new DeleteTaskUseCase(taskRepository);

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

  it("deletes the task for its owner", async () => {
    await useCase.execute({ requestingUser: { id: "user-1", role: "user" }, taskId: "task-1" });
    expect(await taskRepository.findById("task-1")).toBeNull();
  });

  it("allows an admin to delete another user's task", async () => {
    await useCase.execute({ requestingUser: { id: "admin-1", role: "admin" }, taskId: "task-1" });
    expect(await taskRepository.findById("task-1")).toBeNull();
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
