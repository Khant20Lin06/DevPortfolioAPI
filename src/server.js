import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import "./lib/sentry.js";
import { prisma } from "./prisma.js";
import { ensureConfiguredAdmin } from "./services/authService.js";
import { setupSocket } from "./socket.js";

const app = createApp();

const bootstrap = async () => {
  await ensureConfiguredAdmin();

  const httpServer = http.createServer(app);
  const io = setupSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info({ event: "server.started", port: env.PORT }, "Backend listening");
  });

  const shutdown = async (signal) => {
    logger.info({ event: "server.shutdown", signal }, "Shutting down server");

    io.close();
    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
};

bootstrap().catch(async (error) => {
  logger.error({ event: "server.bootstrap_failed", message: error?.message }, error);
  await prisma.$disconnect();
  process.exit(1);
});
