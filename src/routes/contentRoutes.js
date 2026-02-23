import { Router } from "express";
import { getPortfolioContent } from "../services/contentService.js";

const router = Router();

router.get("/content", async (_req, res, next) => {
  try {
    const content = await getPortfolioContent();
    res.status(200).json({ content });
  } catch (error) {
    next(error);
  }
});

export default router;
