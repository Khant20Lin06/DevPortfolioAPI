import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import { savePushSubscription, sendPushToSubscription } from "../services/pushService.js";

const router = Router();

const WELCOME_PAYLOAD = {
  title: "Welcome",
  body: "Hi! How can I help you today?",
  url: "/?chat=1",
};

router.post("/push/subscribe", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const subscription = payload.subscription ?? payload;
    const guestId = payload.guestId ? String(payload.guestId) : null;
    const deviceId = payload.deviceId ? String(payload.deviceId).trim() : null;
    const audience = req.auth.role === "admin" ? "admin" : "user";
    const shouldSendWelcome = payload.welcome === true;
    const welcomeDispatch = {
      attempted: false,
      delivered: false,
      fallback: shouldSendWelcome,
    };
    const result = await savePushSubscription({
      userId: req.auth.userId,
      guestId,
      deviceId,
      audience,
      subscription,
    });
    if (audience !== "admin" && shouldSendWelcome && result.subscription) {
      welcomeDispatch.attempted = true;
      try {
        await sendPushToSubscription({
          subscription: result.subscription,
          payload: WELCOME_PAYLOAD,
        });
        welcomeDispatch.delivered = true;
        logger.info({
          event: "push.welcome.sent",
          audience,
          userId: req.auth.userId,
          guestId: guestId ?? null,
          deviceId: deviceId ?? null,
        });
      } catch (error) {
        logger.warn({
          event: "push.welcome.failed",
          audience,
          userId: req.auth.userId,
          guestId: guestId ?? null,
          deviceId: deviceId ?? null,
          message: error?.message,
        });
      }
    }
    res.status(200).json({ status: "ok", welcomeDispatch });
  } catch (error) {
    next(error);
  }
});

router.post("/push/subscribe/guest", async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const subscription = payload.subscription ?? payload;
    const guestId = payload.guestId ? String(payload.guestId).trim() : "";
    const deviceId = payload.deviceId ? String(payload.deviceId).trim() : "";
    const shouldSendWelcome = payload.welcome === true;
    const welcomeDispatch = {
      attempted: false,
      delivered: false,
      fallback: shouldSendWelcome,
    };
    if (!guestId) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "guestId is required.",
        fieldErrors: {
          guestId: "guestId is required.",
        },
      });
      return;
    }
    const result = await savePushSubscription({
      userId: null,
      guestId,
      deviceId: deviceId || null,
      audience: "guest",
      subscription,
    });
    if (shouldSendWelcome && result.subscription) {
      welcomeDispatch.attempted = true;
      try {
        await sendPushToSubscription({
          subscription: result.subscription,
          payload: WELCOME_PAYLOAD,
        });
        welcomeDispatch.delivered = true;
        logger.info({
          event: "push.welcome.sent",
          audience: "guest",
          userId: null,
          guestId,
          deviceId: deviceId || null,
        });
      } catch (error) {
        logger.warn({
          event: "push.welcome.failed",
          audience: "guest",
          userId: null,
          guestId,
          deviceId: deviceId || null,
          message: error?.message,
        });
      }
    }
    res.status(200).json({ status: "ok", welcomeDispatch });
  } catch (error) {
    next(error);
  }
});

export default router;
