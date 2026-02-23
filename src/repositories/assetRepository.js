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
