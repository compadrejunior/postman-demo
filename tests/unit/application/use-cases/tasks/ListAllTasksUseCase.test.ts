import { describe, expect, it } from "vitest";
import { ListAllTasksUseCase } from "../../../../../src/application/use-cases/tasks/ListAllTasksUseCase.js";
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

describe("ListAllTasksUseCase", () => {
  it("returns tasks across all users", async () => {
    const taskRepository = new FakeTaskRepository();
    await taskRepository.create(buildTask("task-1", "user-1"));
    await taskRepository.create(buildTask("task-2", "user-2"));

    const useCase = new ListAllTasksUseCase(taskRepository);
    const tasks = await useCase.execute();

    expect(tasks.map((t) => t.id).sort()).toEqual(["task-1", "task-2"]);
  });
});
