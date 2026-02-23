import { HttpError, ValidationError } from "../lib/errors.js";
import { validateMessagePayload, validateReactionPayload } from "../lib/validation.js";
import { emitToAdmins, emitToUser } from "../lib/realtime.js";
import { getChatReaction, removeChatReaction, setChatReaction } from "../lib/chatReactions.js";
import {
  getUserPresenceSummary,
  isAnyAdminOnline,
  isUserOnline,
} from "../lib/presence.js";
import {
  createChatMessage,
  deleteChatMessagesByIds,
  deleteChatMessageById,
  findChatMessageById,
  listChatMessages,
  listChatMessagesByIds,
  listChatThreads,
  markMessagesDelivered,
  markMessagesSeen,
  softDeleteChatMessageForActor,
  softDeleteChatThreadForActor,
  updateChatMessageText,
} from "../repositories/messageRepository.js";
import { findUserById } from "../repositories/authRepository.js";
import { notifyAdmins, notifyUser } from "./notificationService.js";

const emitReceipt = ({ userId, messageIds, deliveredAt = null, seenAt = null }) => {
  if (!messageIds || messageIds.length === 0) return;
  const payload = {
    userId,
    messageIds,
    deliveredAt,
    seenAt,
  };
  emitToUser(userId, "chat:receipt", payload);
  emitToAdmins("chat:receipt", payload);
};

const toMessageResponse = (message) => ({
  ...(message ?? {}),
  id: message.id,
  userId: message.userId,
  senderRole: message.senderRole,
  senderId: message.senderId,
  user: message.user
    ? {
        id: message.user.id,
        name: message.user.name ?? null,
        email: message.user.email ?? null,
      }
    : null,
  sender:
    message.sender ??
    (message.senderRole === "user" && message.user
      ? {
          id: message.user.id,
          name: message.user.name ?? null,
          email: message.user.email ?? null,
        }
      : null),
  senderName:
    message.sender?.name ??
    (message.senderRole === "user" ? message.user?.name ?? null : null),
  senderEmail:
    message.sender?.email ??
    (message.senderRole === "user" ? message.user?.email ?? null : null),
  message: message.message,
  reaction: message.reaction ?? getChatReaction(message.id)?.emoji ?? null,
  deliveredAt: message.deliveredAt ?? null,
  seenAt: message.seenAt ?? null,
  createdAt: message.createdAt,
});

const isHiddenForActor = ({ messageRecord, actorRole }) => {
  if (!messageRecord) return false;
  if (actorRole === "admin") return Boolean(messageRecord.deletedByAdminAt);
  if (actorRole === "user") return Boolean(messageRecord.deletedByUserAt);
  return false;
};

const isFullyDeleted = (messageRecord) =>
  Boolean(messageRecord?.deletedByUserAt) && Boolean(messageRecord?.deletedByAdminAt);

const assertMessageEditOwnership = ({ messageRecord, actorId, actorRole, targetUserId = null }) => {
  if (!messageRecord) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }
  if (targetUserId && messageRecord.userId !== targetUserId) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }

  if (actorRole === "admin") {
    if (messageRecord.senderRole !== "admin" || messageRecord.senderId !== actorId) {
      throw new HttpError(403, "FORBIDDEN", "You cannot modify this message.");
    }
    return;
  }

  if (actorRole === "user") {
    if (messageRecord.senderRole !== "user" || messageRecord.senderId !== actorId) {
      throw new HttpError(403, "FORBIDDEN", "You cannot modify this message.");
    }
    return;
  }

  throw new HttpError(403, "FORBIDDEN", "You cannot modify this message.");
};

const assertMessageDeleteAccess = ({ messageRecord, actorId, actorRole, targetUserId = null }) => {
  if (!messageRecord) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }
  if (targetUserId && messageRecord.userId !== targetUserId) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }

  if (actorRole === "admin") return;
  if (actorRole === "user" && messageRecord.userId === actorId) return;

  throw new HttpError(403, "FORBIDDEN", "You cannot delete this message.");
};

const emitMessageDeleted = ({ messageRecord, deletedFor }) => {
  const payload = {
    id: messageRecord.id,
    userId: messageRecord.userId,
    senderRole: messageRecord.senderRole,
    senderId: messageRecord.senderId,
    deletedAt: new Date().toISOString(),
    deletedFor,
  };

  if (deletedFor === "both") {
    emitToUser(messageRecord.userId, "chat:message_deleted", payload);
    emitToAdmins("chat:message_deleted", payload);
    return payload;
  }
  if (deletedFor === "admin") {
    emitToAdmins("chat:message_deleted", payload);
    return payload;
  }
  emitToUser(messageRecord.userId, "chat:message_deleted", payload);
  return payload;
};

const assertUserChatActor = ({ actorRole }) => {
  if (actorRole && actorRole !== "user") {
    throw new HttpError(403, "FORBIDDEN", "User chat endpoint is only available for user accounts.");
  }
};

const assertAdminTargetUser = async ({ targetUserId }) => {
  const target = await findUserById(targetUserId);
  if (!target || !target.isActive || target.role !== "user") {
    throw new HttpError(404, "USER_NOT_FOUND", "User was not found.");
  }
};

export const sendChatMessage = async ({ userId, actorRole = "user", payload }) => {
  assertUserChatActor({ actorRole });

  const parsed = validateMessagePayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const deliveredAt = isAnyAdminOnline() ? new Date() : null;
  const created = await createChatMessage({
    userId,
    message: parsed.data.message.trim(),
    senderRole: "user",
    senderId: userId,
    deliveredAt,
  });

  const response = toMessageResponse(created);

  emitToUser(userId, "chat:message", response);
  emitToAdmins("chat:message", response);
  emitToAdmins("notification:new", {
    type: "chat",
    title: "New chat message",
    body: created.message.slice(0, 120),
    createdAt: created.createdAt,
    data: { userId, messageId: created.id },
  });
  await notifyAdmins({
    type: "chat",
    title: "New chat message",
    body: created.message.slice(0, 120),
    data: { userId, messageId: created.id },
  });

  return response;
};

export const sendAdminMessage = async ({ adminId, targetUserId, payload }) => {
  await assertAdminTargetUser({ targetUserId });

  const parsed = validateMessagePayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const deliveredAt = isUserOnline(targetUserId) ? new Date() : null;
  const created = await createChatMessage({
    userId: targetUserId,
    message: parsed.data.message.trim(),
    senderRole: "admin",
    senderId: adminId,
    deliveredAt,
  });

  const response = toMessageResponse(created);

  emitToUser(targetUserId, "chat:message", response);
  emitToAdmins("chat:message", response);
  emitToUser(targetUserId, "notification:new", {
    type: "chat",
    title: "New admin reply",
    body: created.message.slice(0, 120),
    createdAt: created.createdAt,
    data: { userId: targetUserId, messageId: created.id },
  });

  await notifyUser({
    userId: targetUserId,
    type: "chat",
    title: "New admin reply",
    body: created.message.slice(0, 120),
    data: { userId: targetUserId, messageId: created.id },
  });

  return response;
};

export const getChatThreads = async ({ limit = 20 }) =>
  (await listChatThreads({
    viewerRole: "admin",
    limit,
  })).map((thread) => {
    const presence = getUserPresenceSummary(thread.userId);
    return {
      ...thread,
      userPresence: presence,
    };
  });

export const getChatMessages = async ({ userId, limit = 50 }) => {
  await markAdminMessagesDelivered({ userId });

  return (await listChatMessages({
    userId,
    viewerRole: "admin",
    limit,
  })).map((item) => toMessageResponse(item));
};

export const getUserChatMessages = async ({ userId, limit = 50 }) => {
  await markUserMessagesDelivered({ userId });

  return (await listChatMessages({
    userId,
    viewerRole: "user",
    limit,
  })).map((item) => toMessageResponse(item));
};

export const markUserMessagesDelivered = async ({ userId }) => {
  const delivered = await markMessagesDelivered({
    userId,
    senderRole: "admin",
    viewerRole: "user",
  });
  if (delivered.messageIds.length > 0) {
    emitReceipt({
      userId,
      messageIds: delivered.messageIds,
      deliveredAt: delivered.deliveredAt,
    });
  }
  return delivered;
};

export const markAdminMessagesDelivered = async ({ userId }) => {
  const delivered = await markMessagesDelivered({
    userId,
    senderRole: "user",
    viewerRole: "admin",
  });
  if (delivered.messageIds.length > 0) {
    emitReceipt({
      userId,
      messageIds: delivered.messageIds,
      deliveredAt: delivered.deliveredAt,
    });
  }
  return delivered;
};

export const markUserMessagesSeen = async ({ userId }) => {
  const seen = await markMessagesSeen({
    userId,
    senderRole: "admin",
    viewerRole: "user",
  });
  if (seen.messageIds.length > 0) {
    emitReceipt({
      userId,
      messageIds: seen.messageIds,
      seenAt: seen.seenAt,
    });
  }
  return seen;
};

export const markAdminSeenMessages = async ({ userId }) => {
  const seen = await markMessagesSeen({
    userId,
    senderRole: "user",
    viewerRole: "admin",
  });
  if (seen.messageIds.length > 0) {
    emitReceipt({
      userId,
      messageIds: seen.messageIds,
      seenAt: seen.seenAt,
    });
  }
  return seen;
};

export const editChatMessage = async ({
  actorId,
  actorRole,
  messageId,
  payload,
  targetUserId = null,
}) => {
  const parsed = validateMessagePayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const existing = await findChatMessageById({ id: messageId });
  assertMessageEditOwnership({ messageRecord: existing, actorId, actorRole, targetUserId });
  if (isHiddenForActor({ messageRecord: existing, actorRole })) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }

  const updated = await updateChatMessageText({
    id: existing.id,
    message: parsed.data.message.trim(),
  });
  const response = toMessageResponse(updated);

  emitToUser(existing.userId, "chat:message_updated", response);
  emitToAdmins("chat:message_updated", response);

  return response;
};

export const deleteChatMessage = async ({
  actorId,
  actorRole,
  messageId,
  targetUserId = null,
}) => {
  const existing = await findChatMessageById({ id: messageId });
  assertMessageDeleteAccess({ messageRecord: existing, actorId, actorRole, targetUserId });

  if (isHiddenForActor({ messageRecord: existing, actorRole })) {
    return {
      id: existing.id,
      userId: existing.userId,
      senderRole: existing.senderRole,
      senderId: existing.senderId,
      deletedAt: new Date().toISOString(),
      deletedFor: actorRole,
      alreadyDeleted: true,
    };
  }

  const updated = await softDeleteChatMessageForActor({
    id: existing.id,
    actorRole,
  });

  if (isFullyDeleted(updated)) {
    await deleteChatMessageById({ id: existing.id });
    removeChatReaction({ messageId: existing.id });
    return emitMessageDeleted({ messageRecord: updated, deletedFor: "both" });
  }

  return emitMessageDeleted({ messageRecord: updated, deletedFor: actorRole });
};

const softDeleteChatThreadByActor = async ({ userId, actorRole }) => {
  const deleted = await softDeleteChatThreadForActor({
    userId,
    actorRole,
  });

  if (!deleted.hiddenIds.length) {
    return {
      userId,
      hiddenCount: 0,
      hardDeletedCount: 0,
      deletedFor: actorRole,
    };
  }

  const updatedRows = await listChatMessagesByIds({ ids: deleted.hiddenIds });
  const hardDeleteIds = updatedRows.filter((item) => isFullyDeleted(item)).map((item) => item.id);

  if (hardDeleteIds.length > 0) {
    await deleteChatMessagesByIds({ ids: hardDeleteIds });
    hardDeleteIds.forEach((messageId) => {
      removeChatReaction({ messageId });
    });
  }

  return {
    userId,
    hiddenCount: deleted.hiddenIds.length,
    hardDeletedCount: hardDeleteIds.length,
    deletedFor: actorRole,
  };
};

export const deleteChatThreadForAdmin = async ({ targetUserId }) => {
  const userId = String(targetUserId ?? "").trim();
  if (!userId) {
    throw new HttpError(400, "USER_ID_REQUIRED", "User id is required.");
  }

  const result = await softDeleteChatThreadByActor({
    userId,
    actorRole: "admin",
  });

  emitToAdmins("chat:thread_hidden", result);
  return result;
};

export const deleteChatThreadForUser = async ({ userId }) => {
  const targetUserId = String(userId ?? "").trim();
  if (!targetUserId) {
    throw new HttpError(400, "USER_ID_REQUIRED", "User id is required.");
  }

  const result = await softDeleteChatThreadByActor({
    userId: targetUserId,
    actorRole: "user",
  });

  emitToUser(targetUserId, "chat:thread_hidden", result);
  return result;
};

export const reactChatMessage = async ({
  actorId,
  actorRole,
  messageId,
  payload,
  targetUserId = null,
}) => {
  const parsed = validateReactionPayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const existing = await findChatMessageById({ id: messageId });
  if (!existing) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
  }

  if (actorRole === "user") {
    if (existing.userId !== actorId) {
      throw new HttpError(403, "FORBIDDEN", "You cannot react to this message.");
    }
    if (existing.deletedByUserAt) {
      throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
    }
  } else if (actorRole === "admin") {
    if (targetUserId && existing.userId !== targetUserId) {
      throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
    }
    if (existing.deletedByAdminAt) {
      throw new HttpError(404, "MESSAGE_NOT_FOUND", "Message was not found.");
    }
  } else {
    throw new HttpError(403, "FORBIDDEN", "You cannot react to this message.");
  }

  const reactionEntry = setChatReaction({
    messageId: existing.id,
    emoji: parsed.data.emoji,
    byRole: actorRole,
    byId: actorId,
  });

  const response = {
    id: existing.id,
    userId: existing.userId,
    reaction: reactionEntry?.emoji ?? null,
    reactionByRole: reactionEntry?.byRole ?? null,
    reactionById: reactionEntry?.byId ?? null,
    reactedAt: reactionEntry?.updatedAt ?? null,
  };

  emitToUser(existing.userId, "chat:message_reaction", response);
  emitToAdmins("chat:message_reaction", response);

  return response;
};
