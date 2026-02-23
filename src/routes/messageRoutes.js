import { Router } from "express";
import { requireAuth, requireUserRole } from "../middleware/auth.js";
import {
  deleteChatMessage,
  deleteChatThreadForUser,
  editChatMessage,
  getUserChatMessages,
  reactChatMessage,
  sendChatMessage,
} from "../services/messageService.js";

const router = Router();

router.get("/messages", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? "50", 10);
    const messages = await getUserChatMessages({
      userId: req.auth.userId,
      limit: Number.isFinite(limit) ? limit : 50,
    });
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/messages", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const result = await sendChatMessage({
      userId: req.auth.userId,
      actorRole: req.auth.role,
      payload: req.body ?? {},
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/messages", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const result = await deleteChatThreadForUser({
      userId: req.auth.userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/messages/:messageId", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await editChatMessage({
      actorId: req.auth.userId,
      actorRole: "user",
      messageId,
      payload: req.body ?? {},
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/messages/:messageId", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await deleteChatMessage({
      actorId: req.auth.userId,
      actorRole: "user",
      messageId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/messages/:messageId/reaction", requireAuth, requireUserRole, async (req, res, next) => {
  try {
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await reactChatMessage({
      actorId: req.auth.userId,
      actorRole: "user",
      messageId,
      payload: req.body ?? {},
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
