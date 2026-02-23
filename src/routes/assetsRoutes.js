import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { registerUploadedAsset, getAssets } from "../services/assetService.js";
import { uploadDir } from "../lib/uploadDir.js";

const router = Router();

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext.slice(0, 10);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.get("/assets", async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? "50", 10);
    const assets = await getAssets({ limit: Number.isFinite(limit) ? limit : 50 });
    res.status(200).json({ assets });
  } catch (error) {
    next(error);
  }
});

router.post("/assets", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "File is required." });
      return;
    }

    const asset = await registerUploadedAsset({
      file: req.file,
      uploadedById: req.auth.userId,
    });

    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

export default router;
