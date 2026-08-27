#!/usr/bin/env tsx
/**
 * Seeds users + tasks for manual Postman testing.
 *
 * Usage:
 *   npm run seed:dev    # seeds using .env
 *   npm run seed:test   # seeds using .env.test
 *
 * Reads MONGODB_URI/BCRYPT_SALT_ROUNDS from the given env file (or, if none
 * is given/found, straight from process.env — that's the case when this runs
 * inside a container via `docker exec`, since docker-compose already injects
 * those vars). Wipes the `users`/`tasks` collections and inserts the fixed
 * dataset from ./seed-data.mjs.
 */
import { existsSync, readFileSync } from "node:fs";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { loadEnv } from "../src/infrastructure/config/env.js";
import { MongoDatabase } from "../src/infrastructure/database/mongo/connection.js";
import { users, tasks } from "./seed-data.mjs";

function parseEnvFile(path: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key as string] = (rawValue as string).trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

const envFilePath = process.argv[2];
const fileValues = envFilePath && existsSync(envFilePath) ? parseEnvFile(envFilePath) : {};
const env = loadEnv({ ...process.env, ...fileValues });

async function main() {
  console.log(`Seeding ${env.MONGODB_URI}${envFilePath ? ` (from ${envFilePath})` : ""}...`);

  for (const u of users) u.id = randomUUID();

  const database = new MongoDatabase();
  const db = await database.connect(env.MONGODB_URI);

  await db.collection("tasks").deleteMany({});
  await db.collection("users").deleteMany({});

  const userDocs = await Promise.all(
    users.map(async (u) => ({
      _id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: await bcrypt.hash(u.password, env.BCRYPT_SALT_ROUNDS),
      role: u.role,
      createdAt: u.createdAt,
    })),
  );
  await db.collection("users").insertMany(userDocs);

  const idByEmail = new Map(users.map((u) => [u.email, u.id]));
  const taskDocs = tasks.map((t) => ({
    _id: randomUUID(),
    userId: idByEmail.get(t.ownerEmail),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
  await db.collection("tasks").insertMany(taskDocs);

  await database.disconnect();

  console.log(`Seeded ${userDocs.length} users and ${taskDocs.length} tasks.`);
  console.log("Login credentials:");
  for (const u of users) {
    console.log(`  ${u.email} / ${u.password} (${u.role})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
