import { prisma } from "../prisma.js";

export const createAsset = ({ type, filename, url, size, uploadedById }) =>
  prisma.asset.create({
    data: {
      type,
      filename,
      url,
      size,
      uploadedById,
    },
  });

export const listAssets = ({ limit = 50 } = {}) =>
  prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const listAllAssets = () =>
  prisma.asset.findMany({
    orderBy: { createdAt: "desc" },
  });

export const findAssetByUrl = ({ url }) => {
  const normalized = String(url ?? "").trim();
  if (!normalized) return null;

  const where = normalized.startsWith("/uploads/")
    ? {
        OR: [
          { url: normalized },
          { url: { endsWith: normalized } },
        ],
      }
    : { url: normalized };

  return prisma.asset.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const deleteAssetById = ({ id }) =>
  prisma.asset.delete({
    where: { id },
  });
