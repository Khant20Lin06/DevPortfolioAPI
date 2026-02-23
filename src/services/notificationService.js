import { createNotification } from "../repositories/notificationRepository.js";
import { logger } from "../lib/logger.js";
import { listOnlineAdminDeviceIds, listOnlineUserDeviceIds } from "../lib/presence.js";
import {
  getPushSubscriptionsForAudience,
  getPushSubscriptionsForUser,
  sendPushToSubscription,
} from "./pushService.js";

const partitionSubscriptionsByPresence = (subscriptions, onlineDeviceIds) => {
  const onlineSet = new Set(onlineDeviceIds);
  const offline = [];
  const skipped = [];

  for (const item of subscriptions) {
    if (!item.deviceId) {
      offline.push(item);
      continue;
    }
    if (onlineSet.has(item.deviceId)) {
      skipped.push(item);
      continue;
    }
    offline.push(item);
  }

  return { offline, skipped };
};

const sendToSubscriptions = async ({ subscriptions, payload, audience, userId = null }) => {
  let sentCount = 0;
  for (const sub of subscriptions) {
    try {
      await sendPushToSubscription({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
      });
      sentCount += 1;
    } catch (error) {
      logger.warn(
        {
          event: "push.delivery.failed",
          audience,
          userId,
          subscriptionId: sub.id,
          message: error?.message,
        },
        "Push notification failed"
      );
    }
  }
  return sentCount;
};

export const notifyAdmins = async ({ type, title, body, data }) => {
  const notification = await createNotification({
    audience: "admin",
    type,
    title,
    body,
    userId: null,
  });

  const adminUrl =
    type === "chat"
      ? "/admin?view=messages"
      : type === "contact"
        ? "/admin?view=inquiries"
        : "/admin";

  const subscriptions = await getPushSubscriptionsForAudience({ audience: "admin" });
  const onlineDeviceIds = listOnlineAdminDeviceIds();
  const { offline: offlineSubscriptions, skipped } = partitionSubscriptionsByPresence(
    subscriptions,
    onlineDeviceIds
  );
  for (const sub of skipped) {
    logger.info({
      event: "push.delivery.skipped_online_device",
      audience: "admin",
      subscriptionId: sub.id,
      deviceId: sub.deviceId ?? null,
    });
  }
  const sentCount = await sendToSubscriptions({
    subscriptions: offlineSubscriptions,
    payload: {
      title,
      body,
      data,
      url: adminUrl,
    },
    audience: "admin",
  });

  logger.info({
    event: "push.delivery.sent",
    audience: "admin",
    sentCount,
    skippedOnlineCount: Math.max(0, subscriptions.length - offlineSubscriptions.length),
  });

  return notification;
};

export const notifyUser = async ({ userId, type, title, body, data }) => {
  const notification = await createNotification({
    audience: "user",
    type,
    title,
    body,
    userId,
  });

  const userUrl = type === "chat" ? "/?chat=1" : "/";

  const subscriptions = await getPushSubscriptionsForUser({ userId });
  const onlineDeviceIds = listOnlineUserDeviceIds(userId);
  const { offline: offlineSubscriptions, skipped } = partitionSubscriptionsByPresence(
    subscriptions,
    onlineDeviceIds
  );
  for (const sub of skipped) {
    logger.info({
      event: "push.delivery.skipped_online_device",
      audience: "user",
      userId,
      subscriptionId: sub.id,
      deviceId: sub.deviceId ?? null,
    });
  }
  const sentCount = await sendToSubscriptions({
    subscriptions: offlineSubscriptions,
    payload: {
      title,
      body,
      data,
      url: userUrl,
    },
    audience: "user",
    userId,
  });

  logger.info({
    event: "push.delivery.sent",
    audience: "user",
    userId,
    sentCount,
    skippedOnlineCount: Math.max(0, subscriptions.length - offlineSubscriptions.length),
  });

  return notification;
};
