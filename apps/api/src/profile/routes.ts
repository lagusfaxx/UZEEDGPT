import { Router } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";
import { config } from "../config";
import { LocalStorageProvider } from "../storage/local";

export const profileRouter = Router();
profileRouter.use(requireAuth);

const storageProvider = new LocalStorageProvider({ baseDir: config.storageDir, publicPathPrefix: "/uploads" });
const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await storageProvider.ensureBaseDir();
      cb(null, config.storageDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
      const name = `${Date.now()}-${safeBase}${ext}`;
      cb(null, name);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

profileRouter.get("/profile/me", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.session.userId! } });
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json({ user });
});

profileRouter.put("/profile", async (req, res) => {
  const { displayName, bio, address, phone, preferenceGender, gender } = req.body as Record<string, string | null>;
  const allowedGenders = new Set(["MALE", "FEMALE", "OTHER"]);
  const allowedPrefs = new Set(["MALE", "FEMALE", "ALL", "OTHER"]);
  const safeGender = gender && allowedGenders.has(gender) ? gender : undefined;
  const safePreference = preferenceGender && allowedPrefs.has(preferenceGender) ? preferenceGender : undefined;
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: {
      displayName: displayName ?? undefined,
      bio: bio ?? undefined,
      address: address ?? undefined,
      phone: phone ?? undefined,
      preferenceGender: safePreference,
      gender: safeGender
    }
  });
  return res.json({ user });
});

profileRouter.post("/profile/avatar", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const url = storageProvider.publicUrl(req.file.filename);
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: { avatarUrl: url }
  });
  return res.json({ user });
});
