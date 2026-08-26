import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoDatabase } from "../../../../src/infrastructure/database/mongo/connection.js";
import { MongoUserRepository } from "../../../../src/infrastructure/database/mongo/MongoUserRepository.js";
import { User } from "../../../../src/domain/entities/User.js";
import { Email } from "../../../../src/domain/value-objects/Email.js";

describe("MongoUserRepository", () => {
  let mongoServer: MongoMemoryServer;
  let database: MongoDatabase;
  let repository: MongoUserRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    database = new MongoDatabase();
    const db = await database.connect(mongoServer.getUri());
    repository = new MongoUserRepository(db);
  });

  afterAll(async () => {
    await database.disconnect();
    await mongoServer.stop();
  });

  function buildUser(overrides: Partial<{ id: string; email: string; role: "user" | "admin" }> = {}) {
    return User.create({
      id: overrides.id ?? "user-1",
      name: "Ada Lovelace",
      email: Email.create(overrides.email ?? "ada@example.com"),
      passwordHash: "hashed",
      role: overrides.role ?? "user",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
  }

  it("saves and finds a user by email", async () => {
    await repository.save(buildUser());

    const found = await repository.findByEmail("ada@example.com");
    expect(found?.id).toBe("user-1");
    expect(found?.name).toBe("Ada Lovelace");
  });

  it("finds a user by id", async () => {
    await repository.save(buildUser({ id: "user-2", email: "grace@example.com" }));

    const found = await repository.findById("user-2");
    expect(found?.email.value).toBe("grace@example.com");
  });

  it("returns null for an unknown email or id", async () => {
    expect(await repository.findByEmail("missing@example.com")).toBeNull();
    expect(await repository.findById("missing")).toBeNull();
  });

  it("upserts on save when the user already exists", async () => {
    const user = buildUser({ id: "user-3", email: "hopper@example.com" });
    await repository.save(user);

    await repository.save(
      User.create({
        id: "user-3",
        name: "Grace Hopper",
        email: Email.create("hopper@example.com"),
        passwordHash: "hashed",
        role: "admin",
        createdAt: user.createdAt,
      }),
    );

    const found = await repository.findById("user-3");
    expect(found?.role).toBe("admin");
  });
});
