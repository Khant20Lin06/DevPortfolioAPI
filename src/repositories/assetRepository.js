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

export const findAssetByUrl = ({ url }) =>
  prisma.asset.findFirst({
    where: { url },
  });

export const deleteAssetById = ({ id }) =>
  prisma.asset.delete({
    where: { id },
  });
