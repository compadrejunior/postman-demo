import { beforeEach, describe, expect, it } from "vitest";
import { ListTasksUseCase } from "../../../../../src/application/use-cases/tasks/ListTasksUseCase.js";
import { Task } from "../../../../../src/domain/entities/Task.js";
import { FakeTaskRepository } from "../../../_fakes/FakeTaskRepository.js";

function buildTask(id: string, userId: string) {
  return Task.create({
    id,
    userId,
    title: `Task ${id}`,
    description: "",
    status: "todo",
    priority: "low",
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("ListTasksUseCase", () => {
  let taskRepository: FakeTaskRepository;
  let useCase: ListTasksUseCase;

  beforeEach(async () => {
    taskRepository = new FakeTaskRepository();
    useCase = new ListTasksUseCase(taskRepository);

    await taskRepository.create(buildTask("task-1", "user-1"));
    await taskRepository.create(buildTask("task-2", "user-1"));
    await taskRepository.create(buildTask("task-3", "user-2"));
  });

  it("only returns tasks owned by the requesting user", async () => {
    const tasks = await useCase.execute({ requestingUser: { id: "user-1", role: "user" } });

    expect(tasks.map((t) => t.id).sort()).toEqual(["task-1", "task-2"]);
  });

  it("scopes to the requesting user even when the requester is an admin", async () => {
    const tasks = await useCase.execute({ requestingUser: { id: "user-2", role: "admin" } });

    expect(tasks.map((t) => t.id)).toEqual(["task-3"]);
  });
});
