import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "@/config/env";
import { apiErrorHandler } from "@/lib/api/api-handler";
import { apiRouter } from "@/routes";

function parseAllowedOrigins(rawOrigins: unknown): string[] {
  const list = Array.isArray(rawOrigins)
    ? rawOrigins
    : typeof rawOrigins === "string"
      ? rawOrigins.split(",")
      : [];

  return list
    .map((item) => String(item).trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(morgan("dev"));

  const allowedOrigins = parseAllowedOrigins(env.CLIENT_ORIGINS);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Server-to-server, curl, ya Postman requests mein origin nahi hota
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/+$/, "");

        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
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