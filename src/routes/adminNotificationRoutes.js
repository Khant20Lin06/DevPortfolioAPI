import { Router } from "express";
import { ValidationError } from "../lib/errors.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateContactPayload } from "../lib/validation.js";
import { listNotificationsForAudience } from "../repositories/notificationRepository.js";
import {
  createContactMessage,
  deleteContactMessageById,
  findContactMessageById,
  listContactMessages,
  updateContactMessageById,
} from "../repositories/contactRepository.js";

const router = Router();

const toInquiryDto = (record) => ({
  id: record.id,
  name: record.name,
  sender: record.name,
  email: record.email,
  message: record.message,
  preview: record.message,
  subject: "Portfolio Contact Inquiry",
  location: "Portfolio Contact",
  tags: ["Contact"],
  unread: true,
  createdAt: record.createdAt,
});

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

router.get("/inquiries", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? "100", 10);
    const list = await listContactMessages();
    const items = Number.isFinite(limit) ? list.slice(0, limit) : list;
    res.status(200).json({ inquiries: items.map(toInquiryDto) });
  } catch (error) {
    next(error);
  }
});

router.post("/inquiries", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = validateContactPayload(req.body ?? {});
    if (!parsed.ok) {
      throw new ValidationError(parsed.fieldErrors);
    }

    const created = await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });

    res.status(201).json({ inquiry: toInquiryDto(created) });
  } catch (error) {
    next(error);
  }
});

router.put("/inquiries/:inquiryId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inquiryId = String(req.params.inquiryId ?? "").trim();
    if (!inquiryId) {
      throw new ValidationError({ inquiryId: "Inquiry id is required." });
    }

    const parsed = validateContactPayload(req.body ?? {});
    if (!parsed.ok) {
      throw new ValidationError(parsed.fieldErrors);
    }

    const existing = await findContactMessageById({ id: inquiryId });
    if (!existing) {
      res.status(404).json({ message: "Inquiry not found." });
      return;
    }

    const updated = await updateContactMessageById({
      id: inquiryId,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });

    res.status(200).json({ inquiry: toInquiryDto(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete("/inquiries/:inquiryId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inquiryId = String(req.params.inquiryId ?? "").trim();
    if (!inquiryId) {
      throw new ValidationError({ inquiryId: "Inquiry id is required." });
    }

    const existing = await findContactMessageById({ id: inquiryId });
    if (!existing) {
      res.status(404).json({ message: "Inquiry not found." });
      return;
    }

    await deleteContactMessageById({ id: inquiryId });
    res.status(200).json({ deleted: true, inquiryId });
  } catch (error) {
    next(error);
  }
});

export default router;
