import { env } from "../../config/env.js";
import * as localStorage from "./localStorage.js";
import * as s3Storage from "./s3Storage.js";

const DRIVER_MAP = {
  local: localStorage,
  s3: s3Storage,
};

export const storageDriver = env.STORAGE_DRIVER;
export const storage = DRIVER_MAP[storageDriver] ?? localStorage;

export const isManagedAssetUrl = (url) =>
  localStorage.isManagedUrl(url) || s3Storage.isManagedUrl(url);
