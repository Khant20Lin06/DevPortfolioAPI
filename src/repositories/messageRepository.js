import { prisma } from "../prisma.js";

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
};

const visibilityWhereByRole = (viewerRole) => {
  if (viewerRole === "admin") {
    return { deletedByAdminAt: null };
  }
  if (viewerRole === "user") {
    return { deletedByUserAt: null };
  }
  return {};
};

const deletionDataByRole = (actorRole) => {
  const now = new Date();
  if (actorRole === "admin") {
    return { deletedByAdminAt: now };
  }
  if (actorRole === "user") {
    return { deletedByUserAt: now };
  }
  return {};
};

export const createChatMessage = ({ userId, message, senderRole, senderId, deliveredAt = null }) =>
  prisma.chatMessage.create({
    data: {
      userId,
      message,
      senderRole,
      senderId,
      deliveredAt,
    },
    include: {
      user: {
        select: userSummarySelect,
      },
      sender: {
        select: userSummarySelect,
      },
    },
  });

export const findChatMessageById = ({ id }) =>
  prisma.chatMessage.findUnique({
    where: { id },
  });

export const updateChatMessageText = ({ id, message }) =>
  prisma.chatMessage.update({
    where: { id },
    data: { message },
  });

export const deleteChatMessageById = ({ id }) =>
  prisma.chatMessage.delete({
    where: { id },
  });

export const listChatMessages = ({ userId, viewerRole = "user", limit = 50 }) =>
  prisma.chatMessage.findMany({
    where: {
      userId,
      ...visibilityWhereByRole(viewerRole),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: userSummarySelect,
      },
      sender: {
        select: userSummarySelect,
      },
    },
  });

export const listChatThreads = ({ viewerRole = "admin", limit = 20 }) =>
  prisma.chatMessage.findMany({
    where: {
      ...visibilityWhereByRole(viewerRole),
      user: {
        role: "user",
      },
    },
    distinct: ["userId"],
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: userSummarySelect,
      },
    },
  });

export const markMessagesDelivered = async ({ userId, senderRole, viewerRole = "user" }) => {
  const pending = await prisma.chatMessage.findMany({
    where: {
      userId,
      senderRole,
      deliveredAt: null,
      ...visibilityWhereByRole(viewerRole),
    },
    select: {
      id: true,
    },
  });

  const messageIds = pending.map((item) => item.id);
  if (messageIds.length === 0) {
    return { messageIds: [], deliveredAt: null };
  }

  const deliveredAt = new Date();
  await prisma.chatMessage.updateMany({
    where: {
      id: { in: messageIds },
    },
    data: {
      deliveredAt,
    },
  });

  return { messageIds, deliveredAt };
};

export const markMessagesSeen = async ({ userId, senderRole, viewerRole = "user" }) => {
  const pending = await prisma.chatMessage.findMany({
    where: {
      userId,
      senderRole,
      seenAt: null,
      ...visibilityWhereByRole(viewerRole),
    },
    select: {
      id: true,
    },
  });

  const messageIds = pending.map((item) => item.id);
  if (messageIds.length === 0) {
    return { messageIds: [], seenAt: null };
  }

  const seenAt = new Date();
  await prisma.chatMessage.updateMany({
    where: {
      id: { in: messageIds },
    },
    data: {
      seenAt,
      deliveredAt: seenAt,
    },
  });

  return { messageIds, seenAt };
};

export const softDeleteChatMessageForActor = ({ id, actorRole }) =>
  prisma.chatMessage.update({
    where: { id },
    data: deletionDataByRole(actorRole),
  });

export const softDeleteChatThreadForActor = async ({ userId, actorRole }) => {
  const visibleRows = await prisma.chatMessage.findMany({
    where: {
      userId,
      ...visibilityWhereByRole(actorRole),
    },
    select: {
      id: true,
    },
  });

  if (visibleRows.length === 0) {
    return { hiddenIds: [] };
  }

  const hiddenIds = visibleRows.map((item) => item.id);
  await prisma.chatMessage.updateMany({
    where: {
      id: { in: hiddenIds },
    },
    data: deletionDataByRole(actorRole),
  });

  return { hiddenIds };
};

export const listChatMessagesByIds = ({ ids }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.resolve([]);
  }
  return prisma.chatMessage.findMany({
    where: {
      id: { in: ids },
    },
  });
};

export const deleteChatMessagesByIds = ({ ids }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.resolve({ count: 0 });
  }
  return prisma.chatMessage.deleteMany({
    where: {
      id: { in: ids },
    },
  });
};
