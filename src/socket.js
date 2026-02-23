import { Server as SocketIOServer } from "socket.io";
import { allowedOrigins } from "./config/env.js";
import { verifyAuthToken } from "./lib/authToken.js";
import { initRealtime } from "./lib/realtime.js";
import {
  getAdminPresenceSummary,
  getUserPresenceSummary,
  markOffline,
  markOnline,
} from "./lib/presence.js";
import {
  markAdminMessagesDelivered,
  markUserMessagesDelivered,
  markAdminSeenMessages,
  markUserMessagesSeen,
  sendAdminMessage,
  sendChatMessage,
} from "./services/messageService.js";

const getBearerToken = (value = "") => {
  if (!value.startsWith("Bearer ")) return "";
  return value.slice(7);
};

const resolveToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;
  const headerToken = getBearerToken(socket.handshake.headers?.authorization ?? "");
  return headerToken;
};

const resolveGuestId = (socket) => {
  const authGuest = socket.handshake.auth?.guestId;
  if (authGuest) return String(authGuest);
  const queryGuest = socket.handshake.query?.guestId;
  if (queryGuest) return String(queryGuest);
  return "";
};

const resolveDeviceId = (socket) => {
  const authDevice = socket.handshake.auth?.deviceId;
  if (authDevice) return String(authDevice);
  const queryDevice = socket.handshake.query?.deviceId;
  if (queryDevice) return String(queryDevice);
  return `socket:${socket.id}`;
};

export const setupSocket = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = resolveToken(socket);
    if (!token) {
      socket.data.user = null;
      return next();
    }

    try {
      const claims = verifyAuthToken(token);
      socket.data.user = {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
      };
      return next();
    } catch (_error) {
      socket.data.user = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    const emitAdminPresence = () => {
      io.emit("presence:admin", getAdminPresenceSummary());
    };

    const emitUserPresence = (userId) => {
      if (!userId) return;
      io.to("role:admin").emit("presence:user", {
        userId,
        ...getUserPresenceSummary(userId),
      });
    };

    const user = socket.data.user;
    const deviceId = resolveDeviceId(socket);
    const guestId = !user?.id ? resolveGuestId(socket) || `anon:${socket.id}` : "";

    if (user?.id) {
      socket.join(`user:${user.id}`);
      const role = user.role === "admin" ? "admin" : "user";
      socket.data.presence = { role, userId: user.id, deviceId };
      markOnline(socket.data.presence);
      if (user.role === "admin") {
        socket.join("role:admin");
        emitAdminPresence();
      } else {
        emitUserPresence(user.id);
        socket.emit("presence:admin", getAdminPresenceSummary());
      }
    } else if (guestId) {
      socket.data.guestId = guestId;
      socket.join(`guest:${guestId}`);
      socket.data.presence = { role: "guest", guestId, deviceId };
      markOnline(socket.data.presence);
      socket.emit("presence:admin", getAdminPresenceSummary());
    }

    socket.on("chat:send", async (payload, ack) => {
      if (!user?.id) {
        ack?.({ ok: false, error: "UNAUTHORIZED" });
        return;
      }
      if (user.role === "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }

      try {
        const result = await sendChatMessage({
          userId: user.id,
          actorRole: user.role,
          payload: payload ?? {},
        });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("chat:admin_send", async (payload, ack) => {
      if (!user?.id || user.role !== "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }
      const targetUserId = String(payload?.userId ?? "").trim();
      if (!targetUserId) {
        ack?.({ ok: false, error: "TARGET_REQUIRED" });
        return;
      }

      try {
        const result = await sendAdminMessage({
          adminId: user.id,
          targetUserId,
          payload: payload ?? {},
        });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("chat:seen", async (_payload, ack) => {
      if (!user?.id || user.role === "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }

      try {
        const result = await markUserMessagesSeen({ userId: user.id });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("chat:delivered", async (_payload, ack) => {
      if (!user?.id || user.role === "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }

      try {
        const result = await markUserMessagesDelivered({ userId: user.id });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("chat:admin_delivered", async (payload, ack) => {
      if (!user?.id || user.role !== "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }
      const targetUserId = String(payload?.userId ?? "").trim();
      if (!targetUserId) {
        ack?.({ ok: false, error: "TARGET_REQUIRED" });
        return;
      }

      try {
        const result = await markAdminMessagesDelivered({ userId: targetUserId });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("chat:admin_seen", async (payload, ack) => {
      if (!user?.id || user.role !== "admin") {
        ack?.({ ok: false, error: "FORBIDDEN" });
        return;
      }
      const targetUserId = String(payload?.userId ?? "").trim();
      if (!targetUserId) {
        ack?.({ ok: false, error: "TARGET_REQUIRED" });
        return;
      }

      try {
        const result = await markAdminSeenMessages({ userId: targetUserId });
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error?.message ?? "FAILED" });
      }
    });

    socket.on("disconnect", () => {
      if (socket.data.presence) {
        markOffline(socket.data.presence);
        if (socket.data.presence.role === "admin") {
          emitAdminPresence();
        }
        if (socket.data.presence.role === "user") {
          emitUserPresence(socket.data.presence.userId);
        }
      }
    });
  });

  initRealtime(io);
  return io;
};
