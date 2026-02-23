import { prisma } from "../prisma.js";

export const findAllContentRows = () =>
  prisma.portfolioContent.findMany({
    orderBy: { key: "asc" },
  });

export const findContentByKey = (key) =>
  prisma.portfolioContent.findUnique({
    where: { key },
  });

export const upsertContentByKey = ({ key, data, updatedById }) =>
  prisma.portfolioContent.upsert({
    where: { key },
    create: { key, data, updatedById },
    update: { data, updatedById },
  });
