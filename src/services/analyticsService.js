import { ValidationError } from "../lib/errors.js";
import { emitToAdmins } from "../lib/realtime.js";
import { logger } from "../lib/logger.js";
import {
  countPortfolioViews,
  createPortfolioView,
  findPortfolioViewByVisitorKey,
} from "../repositories/analyticsRepository.js";
import { notifyAdmins } from "./notificationService.js";

const normalizeVisitorKey = (value) => String(value ?? "").trim().toLowerCase();

const validateVisitorKey = (visitorKey) => {
  if (!visitorKey) {
    throw new ValidationError({
      visitorKey: "visitorKey is required.",
    });
  }
  if (visitorKey.length < 8 || visitorKey.length > 190) {
    throw new ValidationError({
      visitorKey: "visitorKey must be between 8 and 190 characters.",
    });
  }
};

export const getPortfolioViewStats = async () => {
  const totalViews = await countPortfolioViews();
  return { totalViews };
};

export const trackPortfolioView = async ({ visitorKey, userId = null }) => {
  const normalizedUserId = String(userId ?? "").trim().toLowerCase();
  const effectiveVisitorKey = normalizedUserId ? `user:${normalizedUserId}` : visitorKey;
  const normalizedVisitorKey = normalizeVisitorKey(effectiveVisitorKey);
  validateVisitorKey(normalizedVisitorKey);

  const existing = await findPortfolioViewByVisitorKey({
    visitorKey: normalizedVisitorKey,
  });

  if (existing) {
    const totalViews = await countPortfolioViews();
    return {
      counted: false,
      totalViews,
    };
  }

  try {
    await createPortfolioView({
      visitorKey: normalizedVisitorKey,
      userId: userId ?? null,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      const totalViews = await countPortfolioViews();
      return {
        counted: false,
        totalViews,
      };
    }
    throw error;
  }

  const totalViews = await countPortfolioViews();
  const createdAt = new Date().toISOString();

  const title = "New user Portfolio Views";
  const body = "A new user viewed your portfolio.";
  const data = {
    metric: "portfolio_views",
    totalViews,
    visitorKey: normalizedVisitorKey,
  };

  emitToAdmins("notification:new", {
    type: "system",
    title,
    body,
    createdAt,
    data,
  });

  await notifyAdmins({
    type: "system",
    title,
    body,
    data,
  });

  logger.info({
    event: "analytics.portfolio_view.counted",
    totalViews,
  });

  return {
    counted: true,
    totalViews,
  };
};
