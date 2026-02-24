import { env } from "../../config/env.js";
import fs from "fs/promises";

const trimSlash = (value) => String(value ?? "").replace(/\/+$/, "");
const randomId = () => Math.random().toString(36).slice(2, 10);

const normalizeExt = (name) => {
  const raw = String(name ?? "").trim();
  const match = raw.match(/\.[A-Za-z0-9]{1,10}$/);
  return match ? match[0].toLowerCase() : "";
};

const ensureBuffer = async (file) => {
  if (file?.buffer) return file.buffer;
  if (file?.path) return fs.readFile(file.path);
  return Buffer.from([]);
};

const parseUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch (_error) {
    try {
      return new URL(`https://${raw}`);
    } catch (_nestedError) {
      return null;
    }
  }
};

const assertConfigured = () => {
  const missing = [];
  if (!env.S3_BUCKET) missing.push("S3_BUCKET");
  if (!env.S3_REGION) missing.push("S3_REGION");
  if (!env.S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
  if (!env.S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
  if (missing.length > 0) {
    throw new Error(`S3 storage is not configured. Missing: ${missing.join(", ")}`);
  }
};

let cachedClient = null;

const getClient = async () => {
  if (cachedClient) return cachedClient;
  assertConfigured();

  const { S3Client } = await import("@aws-sdk/client-s3");

  cachedClient = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  return cachedClient;
};

const toPublicUrl = (key) => {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${trimSlash(env.S3_PUBLIC_BASE_URL)}/${key}`;
  }

  if (env.S3_ENDPOINT) {
    const endpoint = trimSlash(env.S3_ENDPOINT);
    return env.S3_FORCE_PATH_STYLE
      ? `${endpoint}/${env.S3_BUCKET}/${key}`
      : `${endpoint.replace(/^(https?:\/\/)/, `$1${env.S3_BUCKET}.`)}/${key}`;
  }

  return `s3://${env.S3_BUCKET}/${key}`;
};

const extractPathFromUrl = (url) => {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith(`s3://${env.S3_BUCKET}/`)) {
    return raw.slice(`s3://${env.S3_BUCKET}/`.length);
  }

  if (env.S3_PUBLIC_BASE_URL) {
    const base = trimSlash(env.S3_PUBLIC_BASE_URL);
    if (raw.startsWith(`${base}/`)) {
      return raw.slice(base.length + 1);
    }
  }

  const parsed = parseUrl(raw);
  if (!parsed) return "";

  const path = parsed.pathname.replace(/^\/+/, "");

  if (env.S3_ENDPOINT) {
    const endpointUrl = parseUrl(env.S3_ENDPOINT);
    if (endpointUrl) {
      const endpointHost = endpointUrl.hostname;
      const endpointPath = endpointUrl.pathname.replace(/^\/+|\/+$/g, "");
      const host = parsed.hostname;

      const pathWithBase = endpointPath ? `${endpointPath}/${path}` : path;
      const pathStylePrefix = endpointPath
        ? `${endpointPath}/${env.S3_BUCKET}/`
        : `${env.S3_BUCKET}/`;

      if (host === endpointHost && pathWithBase.startsWith(pathStylePrefix)) {
        return pathWithBase.slice(pathStylePrefix.length);
      }

      if (host === `${env.S3_BUCKET}.${endpointHost}`) {
        return path;
      }
    }
  }

  if (parsed.hostname.startsWith(`${env.S3_BUCKET}.s3.`)) {
    return path;
  }

  if (parsed.hostname.includes(".amazonaws.com") && path.startsWith(`${env.S3_BUCKET}/`)) {
    return path.slice(`${env.S3_BUCKET}/`.length);
  }

  return "";
};

export const isManagedUrl = (url) => Boolean(extractPathFromUrl(url));

export const save = async (file) => {
  const client = await getClient();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");

  const ext = normalizeExt(file?.originalname);
  const key = `assets/${Date.now()}-${randomId()}${ext}`;
  const buffer = await ensureBuffer(file);

  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file?.mimetype || "application/octet-stream",
    })
  );

  return {
    url: toPublicUrl(key),
    key,
    size: Number(file?.size ?? buffer.length ?? 0),
    filename: key,
  };
};

export const deleteByUrl = async (url, { asset } = {}) => {
  const keyFromAsset = String(asset?.filename ?? "").trim();
  const key = keyFromAsset || extractPathFromUrl(url);
  if (!key) {
    return { deleted: false, reason: "unmanaged_url" };
  }

  const client = await getClient();
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    })
  );

  return { deleted: true, key };
};
