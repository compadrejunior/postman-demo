import type { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildContainer } from "../../../src/composition/container.js";
import { MongoDatabase } from "../../../src/infrastructure/database/mongo/connection.js";
import { createApp } from "../../../src/presentation/http/express/app.js";

describe("Task HTTP routes", () => {
  let mongoServer: MongoMemoryServer;
  let database: MongoDatabase;
  let app: Express;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    database = new MongoDatabase();
    const db = await database.connect(mongoServer.getUri());
    const container = buildContainer(db, {
      NODE_ENV: "test",
      PORT: 0,
      MONGODB_URI: mongoServer.getUri(),
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "1h",
      BCRYPT_SALT_ROUNDS: 4,
    });
    app = createApp(container);
  });

  afterAll(async () => {
    await database.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await database.getDb().collection("users").deleteMany({});
    await database.getDb().collection("tasks").deleteMany({});
  });

  async function registerAndLogin(email: string): Promise<{ token: string; userId: string }> {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    const loginResponse = await request(app).post("/api/auth/login").send({ email, password: "password123" });

    return { token: loginResponse.body.token as string, userId: registerResponse.body.id as string };
  }

  async function promoteToAdmin(userId: string): Promise<void> {
    await database.getDb().collection("users").updateOne({ _id: userId }, { $set: { role: "admin" } });
  }

  it("requires authentication", async () => {
    const response = await request(app).get("/api/tasks");
    expect(response.status).toBe(401);
  });

  it("creates, lists, reads, updates, and deletes a task for its owner", async () => {
    const { token } = await registerAndLogin("owner@example.com");

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Write tests", priority: "high" });
    expect(createResponse.status).toBe(201);
    const taskId = createResponse.body.id as string;

    const listResponse = await request(app).get("/api/tasks").set("Authorization", `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const getResponse = await request(app).get(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe("Write tests");

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "done" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe("done");

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);

    const getAfterDelete = await request(app).get(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("prevents one user from seeing or modifying another user's tasks", async () => {
    const owner = await registerAndLogin("owner2@example.com");
    const intruder = await registerAndLogin("intruder@example.com");

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Private task" });
    const taskId = createResponse.body.id as string;

    const listResponse = await request(app).get("/api/tasks").set("Authorization", `Bearer ${intruder.token}`);
    expect(listResponse.body).toHaveLength(0);

    const getResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${intruder.token}`);
    expect(getResponse.status).toBe(403);

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ status: "done" });
    expect(updateResponse.status).toBe(403);

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${intruder.token}`);
    expect(deleteResponse.status).toBe(403);
  });

  it("lets an admin read and modify any user's task, but keeps GET /api/tasks scoped to their own", async () => {
    const owner = await registerAndLogin("owner3@example.com");
    const admin = await registerAndLogin("admin1@example.com");
    await promoteToAdmin(admin.userId);
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin1@example.com",
      password: "password123",
    });
    const adminToken = adminLogin.body.token as string;

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Owner task" });
    const taskId = createResponse.body.id as string;

    const getResponse = await request(app).get(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);

    const ownScopedList = await request(app).get("/api/tasks").set("Authorization", `Bearer ${adminToken}`);
    expect(ownScopedList.body).toHaveLength(0);
  });

  it("restricts GET /api/admin/tasks to admins and returns tasks across all users", async () => {
    const owner = await registerAndLogin("owner4@example.com");
    const admin = await registerAndLogin("admin2@example.com");
    await promoteToAdmin(admin.userId);
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin2@example.com",
      password: "password123",
    });
    const adminToken = adminLogin.body.token as string;

    await request(app).post("/api/tasks").set("Authorization", `Bearer ${owner.token}`).send({ title: "Task A" });

    const forbidden = await request(app).get("/api/admin/tasks").set("Authorization", `Bearer ${owner.token}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app).get("/api/admin/tasks").set("Authorization", `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body).toHaveLength(1);
  });
});
