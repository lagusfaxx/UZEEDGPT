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
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      media: true,
      author: { select: { id: true, displayName: true, username: true, avatarUrl: true, profileType: true } }
    }
  });

  const payload = posts.map((p) => {
    const paywalled = !p.isPublic && !active;
    const author = p.author || {
      id: "unknown",
      displayName: "UZEED",
      username: "uzeed",
      avatarUrl: null,
      profileType: "CREATOR"
    };
    return {
      id: p.id,
      title: p.title,
      body: paywalled ? p.body.slice(0, 220) + "…" : p.body,
      createdAt: p.createdAt.toISOString(),
      price: p.price,
      isPublic: p.isPublic,
      media: paywalled ? [] : p.media.map((m) => ({ id: m.id, type: m.type, url: m.url })),
      paywalled,
      author
    };
  });

  return res.json({ active, posts: payload });
});

feedRouter.get("/dashboard", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId! },
    select: {
      membershipExpiresAt: true,
      shopTrialEndsAt: true,
      profileType: true,
      avatarUrl: true,
      address: true,
      phone: true,
      displayName: true,
      username: true
    }
  });
  const expiresAt = user?.membershipExpiresAt?.toISOString() || null;
  const active = !!(user?.membershipExpiresAt && user.membershipExpiresAt.getTime() > Date.now());
  const shopTrialEndsAt = user?.shopTrialEndsAt?.toISOString() || null;
  return res.json({
    active,
    membershipExpiresAt: expiresAt,
    shopTrialEndsAt,
    profileType: user?.profileType,
    avatarUrl: user?.avatarUrl,
    address: user?.address,
    phone: user?.phone,
    displayName: user?.displayName,
    username: user?.username
  });
});
