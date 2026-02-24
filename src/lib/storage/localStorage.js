import fs from "fs/promises";
import path from "path";
import { uploadDir } from "../uploadDir.js";

const normalizeExt = (name) => {
  const ext = path.extname(String(name ?? "")).trim().toLowerCase();
  return ext.slice(0, 12);
};

const randomId = () => Math.random().toString(36).slice(2, 10);

const ensureBuffer = async (file) => {
  if (file?.buffer) return file.buffer;
  if (file?.path) return fs.readFile(file.path);
  return Buffer.from([]);
};

const extractManagedPath = (url) => {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("/uploads/")) return raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) return parsed.pathname;
    } catch (_error) {
      return "";
    }
  }
  return "";
};

export const save = async (file) => {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = normalizeExt(file?.originalname);
  const filename = `${Date.now()}-${randomId()}${ext}`;
  const outputPath = path.resolve(uploadDir, filename);
  const buffer = await ensureBuffer(file);

  await fs.writeFile(outputPath, buffer);

  return {
    url: `/uploads/${filename}`,
    key: filename,
    size: Number(file?.size ?? buffer.length ?? 0),
    filename,
  };
};

export const isManagedUrl = (url) => Boolean(extractManagedPath(url));

export const deleteByUrl = async (url) => {
  const managedPath = extractManagedPath(url);
  if (!managedPath) {
    return { deleted: false, reason: "unmanaged_url" };
  }

  const relative = managedPath.replace(/^\/uploads\//, "");
  const absolute = path.resolve(uploadDir, relative);
  const root = path.resolve(uploadDir);
  if (!absolute.startsWith(root)) {
    return { deleted: false, reason: "unsafe_path" };
  }

  try {
    await fs.unlink(absolute);
    return { deleted: true, key: relative };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { deleted: false, reason: "not_found", key: relative };
    }
    throw error;
  }
};
