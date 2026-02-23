import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: toInt(process.env.PORT, 4000),

  DATABASE_URL: process.env.DATABASE_URL ?? "",

  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "",
  STAGING_FRONTEND_ORIGIN: process.env.STAGING_FRONTEND_ORIGIN ?? "",

  FEATURE_AUTH_ENABLED: toBool(process.env.FEATURE_AUTH_ENABLED, true),
  JWT_SECRET: process.env.JWT_SECRET ?? "unsafe-dev-secret",
  JWT_EXPIRES_IN_HOURS: toInt(process.env.JWT_EXPIRES_IN_HOURS, 24),
  ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL ?? "",
  ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD ?? "",

  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",

  PUSH_VAPID_PUBLIC_KEY: process.env.PUSH_VAPID_PUBLIC_KEY ?? "",
  PUSH_VAPID_PRIVATE_KEY: process.env.PUSH_VAPID_PRIVATE_KEY ?? "",
  PUSH_SUBJECT: process.env.PUSH_SUBJECT ?? "",
};

export const allowedOrigins = [env.FRONTEND_ORIGIN, env.STAGING_FRONTEND_ORIGIN].filter(Boolean);
