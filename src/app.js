import path from "path";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { allowedOrigins, env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./lib/logger.js";
import { getMetricsSnapshot, observeLatency } from "./lib/metrics.js";
import { HttpError } from "./lib/errors.js";
import contactRoutes from "./routes/contactRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminContentRoutes from "./routes/adminContentRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import assetsRoutes from "./routes/assetsRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminChatRoutes from "./routes/adminChatRoutes.js";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";

const corsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origin is not allowed."));
};

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "512kb" }));
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      observeLatency(durationMs);

      logger.info({
        event: "http.request.completed",
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "portfolio-backend" });
  });

  app.get("/metrics", (_req, res) => {
    res.status(200).json(getMetricsSnapshot());
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1", contentRoutes);
  app.use("/api/v1", analyticsRoutes);
  app.use("/api/v1", contactRoutes);
  app.use("/api/v1", assetsRoutes);
  app.use("/api/v1", messageRoutes);
  app.use("/api/v1", pushRoutes);
  app.use("/api/v1/admin", adminContentRoutes);
  app.use("/api/v1/admin", adminAnalyticsRoutes);
  app.use("/api/v1/admin", adminChatRoutes);
  app.use("/api/v1/admin", adminNotificationRoutes);

  app.use((req, _res, next) => {
    next(new HttpError(404, "NOT_FOUND", "Route not found."));
  });

  app.use(errorHandler);

  return app;
};
