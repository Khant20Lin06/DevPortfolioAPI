import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { registerUploadedAsset, getAssets } from "../services/assetService.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
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
