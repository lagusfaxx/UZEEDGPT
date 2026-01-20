import { Router } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";
import { CreatePostSchema } from "@uzeed/shared";
import { config } from "../config";
import { LocalStorageProvider } from "../storage/local";

export const creatorRouter = Router();
creatorRouter.use(requireAuth);

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

async function ensureCreator(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileType: true } });
  if (!user || !["CREATOR", "PROFESSIONAL"].includes(user.profileType)) {
    return false;
  }
  return true;
}

creatorRouter.get("/creator/posts", async (req, res) => {
  const ok = await ensureCreator(req.session.userId!);
  if (!ok) return res.status(403).json({ error: "FORBIDDEN" });

  const posts = await prisma.post.findMany({
    where: { authorId: req.session.userId! },
    orderBy: { createdAt: "desc" },
    include: { media: true }
  });
  return res.json({ posts });
});

creatorRouter.post("/creator/posts", upload.array("files", 10), async (req, res) => {
  const ok = await ensureCreator(req.session.userId!);
  if (!ok) return res.status(403).json({ error: "FORBIDDEN" });

  const { title, body, isPublic, price } = req.body as Record<string, string>;
  const payload = {
    title,
    body,
    isPublic: isPublic === "true",
    price: price ? Number(price) : 0
  };
  const parsed = CreatePostSchema.safeParse(payload);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const post = await prisma.post.create({
    data: {
      authorId: req.session.userId!,
      title: parsed.data.title,
      body: parsed.data.body,
      isPublic: parsed.data.isPublic,
      price: parsed.data.price
    }
  });

  const files = (req.files as Express.Multer.File[]) ?? [];
  const media = [];
  for (const file of files) {
    const mime = (file.mimetype || "").toLowerCase();
    const type = mime.startsWith("video/") ? "VIDEO" : "IMAGE";
    const url = storageProvider.publicUrl(file.filename);
    media.push(await prisma.media.create({ data: { postId: post.id, type, url } }));
  }

  return res.json({ post: { ...post, media } });
});
