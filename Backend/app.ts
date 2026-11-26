import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "@/config/env";
import { apiErrorHandler } from "@/lib/api/api-handler";
import { apiRouter } from "@/routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.CLIENT_ORIGINS,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_request, response) => {
    response.json({ success: true, data: { status: "ok" } });
  });
  app.use("/api", apiRouter);
  app.use((_request, response) => {
    response.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found." },
    });
  });
  app.use(apiErrorHandler);

  return app;
}
