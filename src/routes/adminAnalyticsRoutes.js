import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { getPortfolioViewStats } from "../services/analyticsService.js";

const router = Router();

router.get("/analytics/portfolio", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const stats = await getPortfolioViewStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
