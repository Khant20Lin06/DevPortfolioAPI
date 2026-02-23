import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..", "..");

export const uploadDir = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(backendRoot, env.UPLOAD_DIR);
