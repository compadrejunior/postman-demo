#!/usr/bin/env node
/**
 * Plain-JS twin of seed.ts for the slim `runtime` image (no tsx, no src/ —
 * only compiled dist/ and production node_modules). Run inside the prod
 * container: `docker exec <container> node scripts/seed.prod.mjs`.
 * Reads MONGODB_URI/BCRYPT_SALT_ROUNDS straight from process.env, which
 * docker-compose already populates via env_file/environment.
 */
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { loadEnv } from "../dist/infrastructure/config/env.js";
import { MongoDatabase } from "../dist/infrastructure/database/mongo/connection.js";
import { users, tasks } from "./seed-data.mjs";

const env = loadEnv(process.env);

async function main() {
  console.log(`Seeding ${env.MONGODB_URI}...`);

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
