import { describe, expect, it } from "vitest";
import { Task } from "../../../../src/domain/entities/Task.js";

function buildTask(overrides: Partial<Parameters<typeof Task.create>[0]> = {}) {
  return Task.create({
    id: "task-1",
    userId: "user-1",
    title: "Write tests",
    description: "Cover the domain layer",
    status: "todo",
    priority: "medium",
    dueDate: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  });
}

describe("Task", () => {
  it("is accessible by its owner", () => {
    const task = buildTask({ userId: "user-1" });
    expect(task.isAccessibleBy("user-1", "user")).toBe(true);
  });

  it("is not accessible by a different regular user", () => {
    const task = buildTask({ userId: "user-1" });
    expect(task.isAccessibleBy("user-2", "user")).toBe(false);
  });

  it("is accessible by an admin regardless of ownership", () => {
    const task = buildTask({ userId: "user-1" });
    expect(task.isAccessibleBy("user-2", "admin")).toBe(true);
  });

  it("applyUpdate returns a new task with merged fields and a fresh updatedAt", () => {
    const task = buildTask();
    const updatedAt = new Date("2026-02-01T00:00:00Z");

    const updated = task.applyUpdate({ title: "Write more tests", status: "done" }, updatedAt);

    expect(updated.title).toBe("Write more tests");
    expect(updated.status).toBe("done");
    expect(updated.description).toBe(task.description);
    expect(updated.updatedAt).toBe(updatedAt);
    expect(task.title).toBe("Write tests");
  });

  it("toProps returns a snapshot of all fields", () => {
    const task = buildTask();
    expect(task.toProps()).toMatchObject({
      id: "task-1",
      userId: "user-1",
      title: "Write tests",
    });
  });
});
