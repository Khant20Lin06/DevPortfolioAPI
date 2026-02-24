import {
  createAsset,
  deleteAssetById,
  findAssetByUrl,
  listAllAssets,
  listAssets,
} from "../repositories/assetRepository.js";
import { isManagedAssetUrl, storage } from "../lib/storage/index.js";

const resolveType = (mimetype) => {
  if (!mimetype) return "file";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.includes("svg")) return "icon";
  return "file";
};

const normalizeManagedUrl = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("/uploads/")) {
    return input.split("?")[0].split("#")[0];
  }
  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      if (parsed.pathname.startsWith("/uploads/")) {
        return parsed.pathname;
      }
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch (_error) {
      return input;
    }
  }
  return input;
};

export const registerUploadedAsset = async ({ file, uploadedById }) => {
  const stored = await storage.save(file);
  const type = resolveType(file.mimetype);

  const created = await createAsset({
    type,
    filename: stored.filename,
    url: stored.url,
    size: stored.size,
    uploadedById,
  });

  return {
    id: created.id,
    type: created.type,
    filename: created.filename,
    url: created.url,
    size: created.size,
    key: stored.key,
    createdAt: created.createdAt,
  };
};

export const getAssets = async ({ limit }) => {
  const assets = await listAssets({ limit });
  return assets.map((asset) => ({
    id: asset.id,
    type: asset.type,
    filename: asset.filename,
    url: asset.url,
    size: asset.size,
    createdAt: asset.createdAt,
  }));
};

const collectFromNode = (node, output) => {
  if (typeof node === "string") {
    const value = normalizeManagedUrl(node);
    if (value && isManagedAssetUrl(value)) {
      output.add(value);
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectFromNode(child, output));
    return;
  }

  if (node && typeof node === "object") {
    Object.values(node).forEach((child) => collectFromNode(child, output));
  }
};

export const collectManagedAssetUrls = (input) => {
  const output = new Set();
  collectFromNode(input, output);
  return output;
};

export const deleteManagedAssetByUrl = async (url) => {
  const normalized = normalizeManagedUrl(url);
  if (!normalized || !isManagedAssetUrl(normalized)) {
    return { deleted: false, reason: "unmanaged_url" };
  }

  const asset = await findAssetByUrl({ url: normalized });
  const result = await storage.deleteByUrl(normalized, { asset: asset ?? null });

  if (asset) {
    await deleteAssetById({ id: asset.id });
  }

  return {
    ...result,
    assetId: asset?.id ?? null,
  };
};

export const listAllManagedAssets = async () => {
  const items = await listAllAssets();
  return items.filter((asset) => isManagedAssetUrl(asset.url));
};
