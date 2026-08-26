import type { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildContainer } from "../../../src/composition/container.js";
import { MongoDatabase } from "../../../src/infrastructure/database/mongo/connection.js";
import { createApp } from "../../../src/presentation/http/express/app.js";

describe("Auth HTTP routes", () => {
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
  });

  it("registers a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: "Ada", email: "ada@example.com", role: "user" });
  });

  it("rejects registration with an invalid body", async () => {
    const response = await request(app).post("/api/auth/register").send({ name: "", email: "bad", password: "x" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate registration", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada 2", email: "ada@example.com", password: "password456" });

    expect(response.status).toBe(409);
  });

  it("logs in with valid credentials and rejects invalid ones", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "password123" });

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "password123" });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.token).toBeTypeOf("string");

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "wrong-password" });
    expect(badLogin.status).toBe(401);
  });
});
