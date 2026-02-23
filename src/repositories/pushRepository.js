import { prisma } from "../prisma.js";

export const findPushSubscriptionByEndpoint = ({ endpoint }) =>
  prisma.pushSubscription.findUnique({
    where: { endpoint },
  });

export const upsertPushSubscription = ({
  userId,
  guestId,
  deviceId,
  audience,
  endpoint,
  p256dh,
  auth,
}) =>
  prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      guestId,
      deviceId,
      audience,
      p256dh,
      auth,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      guestId,
      deviceId,
      audience,
      endpoint,
      p256dh,
      auth,
      lastSeenAt: new Date(),
    },
  });

export const listPushSubscriptionsByUser = ({ userId }) =>
  prisma.pushSubscription.findMany({
    where: { userId },
  });

export const listPushSubscriptionsByGuest = ({ guestId }) =>
  prisma.pushSubscription.findMany({
    where: { guestId },
  });

export const listPushSubscriptionsByAudience = ({ audience }) =>
  prisma.pushSubscription.findMany({
    where: { audience },
  });

export const listAllPushSubscriptions = () =>
  prisma.pushSubscription.findMany();

export const deletePushSubscriptionByEndpoint = ({ endpoint }) =>
  prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });
