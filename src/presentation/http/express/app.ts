import express, { type Express } from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { apiRoutes, type RouteControllers } from "./routes/index.js";

export function createApp(controllers: RouteControllers): Express {
  const app = express();

  app.use(express.json());
  app.use("/api", apiRoutes(controllers));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
