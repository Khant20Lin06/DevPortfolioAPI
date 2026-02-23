import { createAsset, listAssets } from "../repositories/assetRepository.js";

const resolveType = (mimetype) => {
  if (!mimetype) return "file";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.includes("svg")) return "icon";
  return "file";
};

export const registerUploadedAsset = async ({ file, uploadedById }) => {
  const url = `/uploads/${file.filename}`;
  const type = resolveType(file.mimetype);

  const created = await createAsset({
    type,
    filename: file.filename,
    url,
    size: file.size,
    uploadedById,
  });

  return {
    id: created.id,
    type: created.type,
    filename: created.filename,
    url: created.url,
    size: created.size,
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
