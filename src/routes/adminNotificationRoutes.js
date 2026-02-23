import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { listNotificationsForAudience } from "../repositories/notificationRepository.js";

const router = Router();

router.get("/notifications", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? "50", 10);
    const notifications = await listNotificationsForAudience({
      audience: "admin",
      limit: Number.isFinite(limit) ? limit : 50,
    });
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
});

export default router;
