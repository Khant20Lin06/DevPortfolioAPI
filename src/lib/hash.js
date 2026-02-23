import crypto from "node:crypto";
import { env } from "../config/env.js";

export const normalizeEmail = (value) => value.trim().toLowerCase();

export const normalizeText = (value) => value.trim().replace(/\s+/g, " ");

export const stableHash = (value) => {
  const text = String(value ?? "");
  const secret = env.JWT_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(text).digest("hex");
};
