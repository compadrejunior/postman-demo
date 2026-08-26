import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoDatabase } from "../../../../src/infrastructure/database/mongo/connection.js";
import { MongoTaskRepository } from "../../../../src/infrastructure/database/mongo/MongoTaskRepository.js";
import { Task } from "../../../../src/domain/entities/Task.js";

describe("MongoTaskRepository", () => {
  let mongoServer: MongoMemoryServer;
  let database: MongoDatabase;
  let repository: MongoTaskRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    database = new MongoDatabase();
    const db = await database.connect(mongoServer.getUri());
    repository = new MongoTaskRepository(db);
  });

  afterAll(async () => {
    await database.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await database.getDb().collection("tasks").deleteMany({});
  });

  function buildTask(overrides: Partial<{ id: string; userId: string }> = {}) {
    return Task.create({
      id: overrides.id ?? "task-1",
      userId: overrides.userId ?? "user-1",
      title: "Write tests",
      description: "Cover the infrastructure layer",
      status: "todo",
      priority: "medium",
      dueDate: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
  }

  it("creates and finds a task by id", async () => {
    await repository.create(buildTask());
    const found = await repository.findById("task-1");
    expect(found?.title).toBe("Write tests");
  });

  it("finds all tasks for a given user", async () => {
    await repository.create(buildTask({ id: "task-1", userId: "user-1" }));
    await repository.create(buildTask({ id: "task-2", userId: "user-1" }));
    await repository.create(buildTask({ id: "task-3", userId: "user-2" }));

    const tasks = await repository.findAllByUserId("user-1");
    expect(tasks.map((t) => t.id).sort()).toEqual(["task-1", "task-2"]);
  });

  it("finds all tasks across users", async () => {
    await repository.create(buildTask({ id: "task-1", userId: "user-1" }));
    await repository.create(buildTask({ id: "task-2", userId: "user-2" }));

    const tasks = await repository.findAll();
    expect(tasks.map((t) => t.id).sort()).toEqual(["task-1", "task-2"]);
  });

  it("updates a task", async () => {
    await repository.create(buildTask());
    const task = await repository.findById("task-1");
    const updated = task!.applyUpdate({ status: "done" }, new Date("2026-02-01T00:00:00Z"));

    await repository.update(updated);

    const found = await repository.findById("task-1");
    expect(found?.status).toBe("done");
  });

  it("deletes a task", async () => {
    await repository.create(buildTask());
    await repository.delete("task-1");
    expect(await repository.findById("task-1")).toBeNull();
  });

  it("returns null for an unknown id", async () => {
    expect(await repository.findById("missing")).toBeNull();
  });
});
