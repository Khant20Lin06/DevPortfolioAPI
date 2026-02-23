const onlineCounts = new Map();
const actorOnlineCounts = new Map();
const actorLastActiveAt = new Map();

const buildKey = ({ role, userId, guestId, deviceId }) => {
  if (!deviceId) return "";
  if (role === "guest" && guestId) return `guest:${guestId}:${deviceId}`;
  if ((role === "user" || role === "admin") && userId) return `${role}:${userId}:${deviceId}`;
  return "";
};

const buildActorKey = ({ role, userId, guestId }) => {
  if (role === "guest" && guestId) return `guest:${guestId}`;
  if ((role === "user" || role === "admin") && userId) return `${role}:${userId}`;
  return "";
};

const increment = (key) => {
  if (!key) return;
  const next = (onlineCounts.get(key) ?? 0) + 1;
  onlineCounts.set(key, next);
};

const decrement = (key) => {
  if (!key) return;
  const next = (onlineCounts.get(key) ?? 0) - 1;
  if (next <= 0) {
    onlineCounts.delete(key);
    return;
  }
  onlineCounts.set(key, next);
};

const extractDeviceId = (key) => key.split(":").slice(-1)[0] ?? "";

const incrementActor = (actorKey) => {
  if (!actorKey) return;
  const next = (actorOnlineCounts.get(actorKey) ?? 0) + 1;
  actorOnlineCounts.set(actorKey, next);
  actorLastActiveAt.set(actorKey, new Date().toISOString());
};

const decrementActor = (actorKey) => {
  if (!actorKey) return;
  const next = (actorOnlineCounts.get(actorKey) ?? 0) - 1;
  if (next <= 0) {
    actorOnlineCounts.delete(actorKey);
    actorLastActiveAt.set(actorKey, new Date().toISOString());
    return;
  }
  actorOnlineCounts.set(actorKey, next);
  actorLastActiveAt.set(actorKey, new Date().toISOString());
};

export const markOnline = (payload) => {
  increment(buildKey(payload));
  incrementActor(buildActorKey(payload));
};

export const markOffline = (payload) => {
  decrement(buildKey(payload));
  decrementActor(buildActorKey(payload));
};

export const isDeviceOnline = (payload) => (onlineCounts.get(buildKey(payload)) ?? 0) > 0;

export const listOnlineAdminDeviceIds = () => {
  const devices = new Set();
  for (const key of onlineCounts.keys()) {
    if (key.startsWith("admin:")) {
      devices.add(extractDeviceId(key));
    }
  }
  return [...devices];
};

export const listOnlineUserDeviceIds = (userId) => {
  const devices = new Set();
  if (!userId) return [];
  for (const key of onlineCounts.keys()) {
    if (key.startsWith(`user:${userId}:`)) {
      devices.add(extractDeviceId(key));
    }
  }
  return [...devices];
};

export const isUserOnline = (userId) => {
  if (!userId) return false;
  return (actorOnlineCounts.get(`user:${userId}`) ?? 0) > 0;
};

export const isAnyAdminOnline = () => {
  for (const [key, count] of actorOnlineCounts.entries()) {
    if (key.startsWith("admin:") && count > 0) return true;
  }
  return false;
};

export const getUserPresenceSummary = (userId) => {
  if (!userId) return { isOnline: false, lastActiveAt: null };
  const actorKey = `user:${userId}`;
  return {
    isOnline: (actorOnlineCounts.get(actorKey) ?? 0) > 0,
    lastActiveAt: actorLastActiveAt.get(actorKey) ?? null,
  };
};

export const getAdminPresenceSummary = () => {
  let isOnline = false;
  let latestActiveAt = null;

  for (const key of actorLastActiveAt.keys()) {
    if (!key.startsWith("admin:")) continue;
    const value = actorLastActiveAt.get(key) ?? null;
    if (value && (!latestActiveAt || value > latestActiveAt)) {
      latestActiveAt = value;
    }
  }

  for (const [key, count] of actorOnlineCounts.entries()) {
    if (!key.startsWith("admin:")) continue;
    if (count > 0) {
      isOnline = true;
      break;
    }
  }

  return {
    isOnline,
    lastActiveAt: latestActiveAt,
  };
};
