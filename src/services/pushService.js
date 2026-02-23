import webpush from "web-push";
import { env } from "../config/env.js";
import {
  deletePushSubscriptionByEndpoint,
  findPushSubscriptionByEndpoint,
  listAllPushSubscriptions,
  listPushSubscriptionsByAudience,
  listPushSubscriptionsByGuest,
  listPushSubscriptionsByUser,
  upsertPushSubscription,
} from "../repositories/pushRepository.js";
import { logger } from "../lib/logger.js";

let configured = false;

const ensureConfigured = () => {
  if (configured) return true;
  if (!env.PUSH_VAPID_PUBLIC_KEY || !env.PUSH_VAPID_PRIVATE_KEY || !env.PUSH_SUBJECT) {
    return false;
  }
  webpush.setVapidDetails(env.PUSH_SUBJECT, env.PUSH_VAPID_PUBLIC_KEY, env.PUSH_VAPID_PRIVATE_KEY);
  configured = true;
  return true;
};

export const savePushSubscription = async ({ userId, guestId, deviceId, audience, subscription }) => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return { subscription: null, isNew: false };
  }

  const existing = await findPushSubscriptionByEndpoint({ endpoint: subscription.endpoint });
  const resolvedAudience = audience ?? (userId ? "user" : "guest");

  const saved = await upsertPushSubscription({
    userId,
    guestId,
    deviceId: deviceId || null,
    audience: resolvedAudience,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  logger.info({
    event: "push.subscribe.saved",
    audience: resolvedAudience,
    userId: userId ?? null,
    guestId: guestId ?? null,
    deviceId: deviceId ?? null,
    isNew: !existing,
  });

  return { subscription: saved, isNew: !existing };
};

export const getPushSubscriptionsForUser = ({ userId }) =>
  listPushSubscriptionsByUser({ userId });

export const getPushSubscriptionsForAudience = ({ audience }) =>
  listPushSubscriptionsByAudience({ audience });

export const getPushSubscriptionsForGuest = ({ guestId }) =>
  listPushSubscriptionsByGuest({ guestId });

export const sendPushToUser = async ({ userId, payload }) => {
  if (!ensureConfigured()) return;
  const subs = await getPushSubscriptionsForUser({ userId });
  await Promise.all(
    subs.map((sub) =>
      sendPushToSubscription({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
      })
    )
  );
};

export const sendPushToAudience = async ({ audience, payload }) => {
  if (!ensureConfigured()) return;
  const subs = await getPushSubscriptionsForAudience({ audience });
  await Promise.all(
    subs.map((sub) =>
      sendPushToSubscription({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
      })
    )
  );
};

export const sendPushToGuest = async ({ guestId, payload }) => {
  if (!ensureConfigured()) return;
  const subs = await getPushSubscriptionsForGuest({ guestId });
  await Promise.all(
    subs.map((sub) =>
      sendPushToSubscription({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
      })
    )
  );
};

export const sendPushToAll = async ({ payload }) => {
  if (!ensureConfigured()) return;
  const subs = await listAllPushSubscriptions();
  await Promise.all(
    subs.map((sub) =>
      sendPushToSubscription({
        subscription: {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
      })
    )
  );
};

export const sendPushToSubscription = async ({ subscription, payload }) => {
  if (!ensureConfigured()) return;
  if (!subscription?.endpoint || !subscription?.p256dh || !subscription?.auth) return;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    logger.warn({
      event: "push.delivery.failed",
      endpoint: subscription.endpoint,
      statusCode: error?.statusCode ?? null,
      message: error?.message,
    });

    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await deletePushSubscriptionByEndpoint({ endpoint: subscription.endpoint });
      logger.info({
        event: "push.subscription.pruned",
        endpoint: subscription.endpoint,
        statusCode: error.statusCode,
      });
    }

    throw error;
  }
};
