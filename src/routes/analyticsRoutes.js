import { Router } from "express";
import { verifyAuthToken } from "../lib/authToken.js";
import { trackPortfolioView } from "../services/analyticsService.js";

const router = Router();

const resolveUserIdFromAuthHeader = (authorization = "") => {
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return null;
  try {
    const claims = verifyAuthToken(token);
    return claims?.sub ? String(claims.sub) : null;
  } catch (_error) {
    return null;
  }
};

router.post("/analytics/portfolio-view", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    const visitorKey = req.body?.visitorKey;
    const userId = resolveUserIdFromAuthHeader(req.headers.authorization ?? "");
    const result = await trackPortfolioView({ visitorKey, userId });
    res.status(result.counted ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
