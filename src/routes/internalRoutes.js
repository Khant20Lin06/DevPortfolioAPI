import { Router } from "express";
import { runOutboxBatch } from "../services/outboxService.js";

const router = Router();

router.post("/contact-outbox/run", async (_req, res, next) => {
  try {
    const summary = await runOutboxBatch();
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;