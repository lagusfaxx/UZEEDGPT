import { Router } from "express";
import { prisma } from "../db";
import { requireAdmin } from "../auth/middleware";
import { CreatePostSchema } from "@uzeed/shared";
import multer from "multer";
import path from "path";
import { config } from "../config";
import { LocalStorageProvider } from "../storage/local";

export const adminRouter = Router();

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
  limits: { fileSize: 100 * 1024 * 1024 }
});

adminRouter.use(requireAdmin);

adminRouter.get("/posts", async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { media: true } });
  return res.json({ posts: posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    media: p.media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
  })) });
});

adminRouter.post("/posts", async (req, res) => {
  const parsed = CreatePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const post = await prisma.post.create({
    data: {
      authorId: req.session.userId!,
      title: parsed.data.title,
      body: parsed.data.body,
      isPublic: parsed.data.isPublic
    }
  });
  return res.json({ post });
});

adminRouter.put("/posts/:id", async (req, res) => {
  const parsed = CreatePostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: parsed.data
  });
  return res.json({ post });
});

adminRouter.delete("/posts/:id", async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

adminRouter.post("/posts/:id/media", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const mime = (req.file.mimetype || "").toLowerCase();
  const type = mime.startsWith("video/") ? "VIDEO" : "IMAGE";
  const url = storageProvider.publicUrl(req.file.filename);

  const media = await prisma.media.create({
    data: { postId: req.params.id, type, url }
  });

  return res.json({ media });
});
