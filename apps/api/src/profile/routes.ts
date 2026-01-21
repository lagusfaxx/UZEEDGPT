import { Router } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";
import { config } from "../config";
import { LocalStorageProvider } from "../storage/local";
import { isBusinessPlanActive, nextSubscriptionExpiry } from "../lib/subscriptions";

export const profileRouter = Router();

const storageProvider = new LocalStorageProvider({ baseDir: config.storageDir, publicPathPrefix: "/uploads" });

const imageOnlyFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok = (file.mimetype || "").toLowerCase().startsWith("image/");
  if (!ok) return cb(new Error("INVALID_FILE_TYPE"));
  return cb(null, true);
};

const storage = multer.diskStorage({
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
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnlyFilter
});

profileRouter.get("/profiles", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const types = typeof req.query.types === "string" ? req.query.types.split(",").map((t) => t.trim()) : [];
  const where: any = {
    profileType: { in: types.length ? types : ["CREATOR", "PROFESSIONAL", "SHOP"] }
  };
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { serviceCategory: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } }
    ];
  }

  const profiles = await prisma.user.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      city: true,
      address: true,
      serviceCategory: true,
      serviceDescription: true,
      profileType: true,
      subscriptionPrice: true,
      membershipExpiresAt: true,
      shopTrialEndsAt: true,
      latitude: true,
      longitude: true
    }
  });

  const filtered = profiles.filter((p) => isBusinessPlanActive(p));

  return res.json({ profiles: filtered });
});

profileRouter.get("/profiles/:username", async (req, res) => {
  const username = req.params.username;
  const viewerId = req.session.userId || null;
  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      city: true,
      address: true,
      serviceCategory: true,
      serviceDescription: true,
      profileType: true,
      subscriptionPrice: true,
      membershipExpiresAt: true,
      shopTrialEndsAt: true,
      latitude: true,
      longitude: true
    }
  });
  if (!profile) return res.status(404).json({ error: "NOT_FOUND" });
  const isOwner = viewerId === profile.id;
  if (!isOwner && !isBusinessPlanActive(profile)) {
    return res.status(403).json({ error: "PLAN_EXPIRED" });
  }

  const posts = await prisma.post.findMany({
    where: { authorId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { media: true }
  });

  const subscription = viewerId
    ? await prisma.profileSubscription.findUnique({
      where: { subscriberId_profileId: { subscriberId: viewerId, profileId: profile.id } }
    })
    : null;
  const isSubscribed =
    !!subscription && subscription.expiresAt.getTime() > Date.now() || (viewerId && viewerId === profile.id);

  const payload = posts.map((p) => {
    const paywalled = !p.isPublic && !isSubscribed;
    return {
      id: p.id,
      title: p.title,
      body: paywalled ? p.body.slice(0, 220) + "…" : p.body,
      createdAt: p.createdAt.toISOString(),
      isPublic: p.isPublic,
      media: paywalled ? [] : p.media.map((m) => ({ id: m.id, type: m.type, url: m.url })),
      preview: p.media[0] ? { id: p.media[0].id, type: p.media[0].type, url: p.media[0].url } : null,
      paywalled
    };
  });

  const serviceItems = await prisma.serviceItem.findMany({
    where: { ownerId: profile.id },
    orderBy: { createdAt: "desc" }
  });

  return res.json({
    profile,
    isSubscribed,
    isOwner,
    subscriptionExpiresAt: subscription?.expiresAt.toISOString() || null,
    posts: payload,
    serviceItems
  });
});

profileRouter.post("/profiles/:username/subscribe", requireAuth, async (req, res) => {
  const username = req.params.username;
  const viewerId = req.session.userId!;
  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      profileType: true,
      subscriptionPrice: true
    }
  });
  if (!profile) return res.status(404).json({ error: "NOT_FOUND" });
  if (!["CREATOR", "PROFESSIONAL"].includes(profile.profileType)) {
    return res.status(400).json({ error: "NOT_SUBSCRIBABLE" });
  }
  if (profile.id === viewerId) return res.status(400).json({ error: "SELF_SUBSCRIBE" });
  const price = Math.max(100, Math.min(20000, profile.subscriptionPrice || 2500));

  const expiresAt = nextSubscriptionExpiry();
  const subscription = await prisma.profileSubscription.upsert({
    where: { subscriberId_profileId: { subscriberId: viewerId, profileId: profile.id } },
    update: { status: "ACTIVE", expiresAt, price },
    create: { subscriberId: viewerId, profileId: profile.id, status: "ACTIVE", expiresAt, price }
  });

  return res.json({
    subscription: {
      id: subscription.id,
      expiresAt: subscription.expiresAt.toISOString(),
      price: subscription.price
    }
  });
});

profileRouter.get("/profile/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.session.userId! } });
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json({ user });
});

profileRouter.put("/profile", requireAuth, async (req, res) => {
  const {
    displayName,
    bio,
    address,
    phone,
    preferenceGender,
    gender,
    username,
    subscriptionPrice,
    serviceCategory,
    serviceDescription,
    city,
    latitude,
    longitude
  } = req.body as Record<string, string | null>;
  const allowedGenders = new Set(["MALE", "FEMALE", "OTHER"]);
  const allowedPrefs = new Set(["MALE", "FEMALE", "ALL", "OTHER"]);
  const safeGender = gender && allowedGenders.has(gender) ? gender : undefined;
  const safePreference = preferenceGender && allowedPrefs.has(preferenceGender) ? preferenceGender : undefined;
  const priceValue = subscriptionPrice ? Number(subscriptionPrice) : undefined;
  const safePrice =
    priceValue !== undefined && Number.isFinite(priceValue)
      ? Math.max(100, Math.min(20000, priceValue))
      : undefined;
  const me = await prisma.user.findUnique({
    where: { id: req.session.userId! },
    select: { profileType: true }
  });
  if (!me) return res.status(404).json({ error: "NOT_FOUND" });
  const canSetPrice = ["CREATOR", "PROFESSIONAL"].includes(me.profileType);
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: {
      displayName: displayName ?? undefined,
      bio: bio ?? undefined,
      address: address ?? undefined,
      phone: phone ?? undefined,
      preferenceGender: safePreference,
      gender: safeGender,
      username: username ?? undefined,
      subscriptionPrice: canSetPrice ? safePrice : undefined,
      serviceCategory: serviceCategory ?? undefined,
      serviceDescription: serviceDescription ?? undefined,
      city: city ?? undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined
    }
  });
  return res.json({ user });
});

profileRouter.post("/profile/avatar", requireAuth, uploadImage.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const url = storageProvider.publicUrl(req.file.filename);
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: { avatarUrl: url }
  });
  return res.json({ user });
});

profileRouter.post("/profile/cover", requireAuth, uploadImage.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "NO_FILE" });
  const url = storageProvider.publicUrl(req.file.filename);
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: { coverUrl: url }
  });
  return res.json({ user });
});
