const reactionStore = new Map();

export const getChatReaction = (messageId) => {
  const entry = reactionStore.get(messageId);
  if (!entry) return null;
  return {
    emoji: entry.emoji ?? null,
    byRole: entry.byRole ?? null,
    byId: entry.byId ?? null,
    updatedAt: entry.updatedAt ?? null,
  };
};

export const setChatReaction = ({ messageId, emoji, byRole, byId }) => {
  const cleaned = String(emoji ?? "").trim();
  if (!cleaned) {
    reactionStore.delete(messageId);
    return null;
  }

  const next = {
    emoji: cleaned,
    byRole: byRole ?? null,
    byId: byId ?? null,
    updatedAt: new Date().toISOString(),
  };
  reactionStore.set(messageId, next);
  return next;
};

export const removeChatReaction = ({ messageId }) => {
  reactionStore.delete(messageId);
};

