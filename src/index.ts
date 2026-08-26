import { buildContainer } from "./composition/container.js";
import { loadEnv } from "./infrastructure/config/env.js";
import { MongoDatabase } from "./infrastructure/database/mongo/connection.js";
import { createApp } from "./presentation/http/express/app.js";

async function main(): Promise<void> {
  const env = loadEnv();

  const database = new MongoDatabase();
  const db = await database.connect(env.MONGODB_URI);

  const container = buildContainer(db, env);
  const app = createApp(container);

  const server = app.listen(env.PORT, () => {
    console.log(`Task Management API listening on port ${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await database.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
