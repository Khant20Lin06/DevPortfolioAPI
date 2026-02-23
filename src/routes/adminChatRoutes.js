import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import {
  deleteChatMessage,
  deleteChatThreadForAdmin,
  editChatMessage,
  getChatMessages,
  getChatThreads,
  reactChatMessage,
  sendAdminMessage,
} from "../services/messageService.js";

const router = Router();

router.get("/chat/threads", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? "20", 10);
    const threads = await getChatThreads({ limit: Number.isFinite(limit) ? limit : 20 });
    res.status(200).json({ threads });
  } catch (error) {
    next(error);
  }
});

router.get("/chat/threads/:userId/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const limit = Number.parseInt(req.query.limit ?? "50", 10);
    const messages = await getChatMessages({ userId, limit: Number.isFinite(limit) ? limit : 50 });
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/chat/threads/:userId/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const result = await sendAdminMessage({
      adminId: req.auth.userId,
      targetUserId: userId,
      payload: req.body ?? {},
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/chat/threads/:userId/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const result = await deleteChatThreadForAdmin({
      targetUserId: userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/chat/threads/:userId/messages/:messageId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await editChatMessage({
      actorId: req.auth.userId,
      actorRole: "admin",
      messageId,
      payload: req.body ?? {},
      targetUserId: userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/chat/threads/:userId/messages/:messageId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await deleteChatMessage({
      actorId: req.auth.userId,
      actorRole: "admin",
      messageId,
      targetUserId: userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/chat/threads/:userId/messages/:messageId/reaction", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const userId = String(req.params.userId ?? "").trim();
    const messageId = String(req.params.messageId ?? "").trim();
    const result = await reactChatMessage({
      actorId: req.auth.userId,
      actorRole: "admin",
      messageId,
      payload: req.body ?? {},
      targetUserId: userId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
