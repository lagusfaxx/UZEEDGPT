import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";

export const feedRouter = Router();

feedRouter.get("/feed", async (req, res) => {
  const userId = req.session.userId;
  let active = false;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { membershipExpiresAt: true } });
    active = !!(u?.membershipExpiresAt && u.membershipExpiresAt.getTime() > Date.now());
  }

  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { media: true }
  });

  const payload = posts.map((p) => {
    const paywalled = !active;
    return {
      id: p.id,
      title: p.title,
      body: paywalled ? p.body.slice(0, 220) + "…" : p.body,
      createdAt: p.createdAt.toISOString(),
      media: paywalled ? [] : p.media.map((m) => ({ id: m.id, type: m.type, url: m.url })),
      paywalled
    };
  });

  return res.json({ active, posts: payload });
});

feedRouter.get("/dashboard", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.session.userId! }, select: { membershipExpiresAt: true } });
  const expiresAt = user?.membershipExpiresAt?.toISOString() || null;
  const active = !!(user?.membershipExpiresAt && user.membershipExpiresAt.getTime() > Date.now());
  return res.json({ active, membershipExpiresAt: expiresAt });
});
