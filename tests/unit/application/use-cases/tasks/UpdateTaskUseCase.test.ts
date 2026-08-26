import { beforeEach, describe, expect, it } from "vitest";
import { UpdateTaskUseCase } from "../../../../../src/application/use-cases/tasks/UpdateTaskUseCase.js";
import { Task } from "../../../../../src/domain/entities/Task.js";
import { TaskNotFoundError } from "../../../../../src/domain/errors/TaskNotFoundError.js";
import { UnauthorizedTaskAccessError } from "../../../../../src/domain/errors/UnauthorizedTaskAccessError.js";
import { FakeTaskRepository } from "../../../_fakes/FakeTaskRepository.js";
import { FixedClock } from "../../../_fakes/FixedClock.js";

describe("UpdateTaskUseCase", () => {
  let taskRepository: FakeTaskRepository;
  let useCase: UpdateTaskUseCase;
  const updatedAt = new Date("2026-02-01T00:00:00Z");

  beforeEach(async () => {
    taskRepository = new FakeTaskRepository();
    useCase = new UpdateTaskUseCase(taskRepository, new FixedClock(updatedAt));

    await taskRepository.create(
      Task.create({
        id: "task-1",
        userId: "user-1",
        title: "Write tests",
        description: "original",
        status: "todo",
        priority: "low",
        dueDate: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      }),
    );
  });

  it("applies only the provided fields and bumps updatedAt", async () => {
    const output = await useCase.execute({
      requestingUser: { id: "user-1", role: "user" },
      taskId: "task-1",
      status: "done",
    });

    expect(output.status).toBe("done");
    expect(output.description).toBe("original");
    expect(output.updatedAt).toEqual(updatedAt);
  });

  it("applies every updatable field when all are provided", async () => {
    const output = await useCase.execute({
      requestingUser: { id: "user-1", role: "user" },
      taskId: "task-1",
      title: "New title",
      description: "New description",
      status: "in-progress",
      priority: "high",
      dueDate: new Date("2026-03-01T00:00:00Z"),
    });

    expect(output).toMatchObject({
      title: "New title",
      description: "New description",
      status: "in-progress",
      priority: "high",
      dueDate: new Date("2026-03-01T00:00:00Z"),
    });
  });

  it("allows an admin to update another user's task", async () => {
    const output = await useCase.execute({
      requestingUser: { id: "admin-1", role: "admin" },
      taskId: "task-1",
      title: "Updated by admin",
    });

    expect(output.title).toBe("Updated by admin");
  });

  it("throws TaskNotFoundError for an unknown id", async () => {
    await expect(
      useCase.execute({ requestingUser: { id: "user-1", role: "user" }, taskId: "missing", title: "x" }),
    ).rejects.toThrow(TaskNotFoundError);
  });

  it("throws UnauthorizedTaskAccessError for another regular user", async () => {
    await expect(
      useCase.execute({ requestingUser: { id: "user-2", role: "user" }, taskId: "task-1", title: "x" }),
    ).rejects.toThrow(UnauthorizedTaskAccessError);
  });
});
