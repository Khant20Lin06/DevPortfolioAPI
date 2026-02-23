import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  base: undefined,
  redact: {
    paths: [
      "payload.email",
      "payload.name",
      "payload.message",
      "headers.authorization",
      "req.headers.authorization",
    ],
    remove: true,
  },
});