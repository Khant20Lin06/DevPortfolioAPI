import { Router } from "express";
import { getCurrentUser, loginUser, registerUser } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const result = await registerUser(req.body ?? {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const result = await loginUser(req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.auth.userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
