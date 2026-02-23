import { Router } from "express";
import { submitContactMessage } from "../services/contactService.js";

const router = Router();

router.post("/contact", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    const result = await submitContactMessage({
      payload: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
