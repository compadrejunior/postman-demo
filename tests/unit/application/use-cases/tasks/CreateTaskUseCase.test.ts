import { beforeEach, describe, expect, it } from "vitest";
import { CreateTaskUseCase } from "../../../../../src/application/use-cases/tasks/CreateTaskUseCase.js";
import { FakeTaskRepository } from "../../../_fakes/FakeTaskRepository.js";
import { SequentialIdGenerator } from "../../../_fakes/SequentialIdGenerator.js";
import { FixedClock } from "../../../_fakes/FixedClock.js";

describe("CreateTaskUseCase", () => {
  let taskRepository: FakeTaskRepository;
  let useCase: CreateTaskUseCase;
  const now = new Date("2026-01-01T00:00:00Z");

  beforeEach(() => {
    taskRepository = new FakeTaskRepository();
    useCase = new CreateTaskUseCase(taskRepository, new SequentialIdGenerator(), new FixedClock(now));
  });

  it("creates a task owned by the requesting user", async () => {
    const output = await useCase.execute({
      requestingUser: { id: "user-1", role: "user" },
      title: "Write tests",
      description: "Cover the use-case layer",
      status: "todo",
      priority: "high",
      dueDate: null,
    });

    expect(output).toEqual({
      id: "id-1",
      userId: "user-1",
      title: "Write tests",
      description: "Cover the use-case layer",
      status: "todo",
      priority: "high",
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    });

    const stored = await taskRepository.findById("id-1");
    expect(stored?.userId).toBe("user-1");
  });
});
