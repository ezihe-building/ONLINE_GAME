import { Router } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "avatars");
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post("/auth/upload-avatar", upload.single("avatar"), async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const avatarPath = `/api/uploads/avatars/${req.file.filename}`;

  await db
    .update(usersTable)
    .set({ avatarPath })
    .where(eq(usersTable.id, req.session.userId));

  res.json({ avatarPath });
});

export default router;
