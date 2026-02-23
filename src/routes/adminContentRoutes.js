import { Router } from "express";
import { HttpError } from "../lib/errors.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { getAdminContent, updatePortfolioContent } from "../services/contentService.js";

const router = Router();

router.get("/content", async (_req, res, next) => {
  try {
    const result = await getAdminContent();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/content/:key", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const key = String(req.params.key ?? "").trim();
    if (!key) {
      throw new HttpError(400, "VALIDATION_ERROR", "Content key is required.", {
        fieldErrors: { key: "Content key is required." },
      });
    }

    const payload = req.body ?? {};
    if (payload.data === undefined) {
      throw new HttpError(400, "VALIDATION_ERROR", "Content data is required.", {
        fieldErrors: { data: "Content data is required." },
      });
    }
    const updated = await updatePortfolioContent({
      key,
      data: payload.data,
      userId: req.auth.userId,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
