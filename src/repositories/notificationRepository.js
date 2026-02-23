import { prisma } from "../prisma.js";

export const createNotification = ({ audience, type, title, body, userId }) =>
  prisma.notification.create({
    data: {
      audience,
      type,
      title,
      body,
      userId,
    },
  });

export const listNotificationsForAudience = ({ audience, limit = 50 }) =>
  prisma.notification.findMany({
    where: { audience },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const listNotificationsForUser = ({ userId, limit = 50 }) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
