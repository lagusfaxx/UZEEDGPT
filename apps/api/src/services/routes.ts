import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";

export const servicesRouter = Router();

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

servicesRouter.get("/services", async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;

  const profiles = await prisma.user.findMany({
    where: { profileType: { in: ["PROFESSIONAL", "SHOP"] } },
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      serviceCategory: true,
      serviceDescription: true,
      profileType: true
    }
  });

  const enriched = profiles.map((p) => {
    const distance =
      lat !== null && lng !== null && p.latitude !== null && p.longitude !== null
        ? haversine(lat, lng, p.latitude, p.longitude)
        : null;
    return { ...p, distance };
  });

  const sorted = enriched.sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return res.json({ profiles: sorted });
});

servicesRouter.get("/services/:userId/items", async (req, res) => {
  const items = await prisma.serviceItem.findMany({
    where: { ownerId: req.params.userId },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items });
});

servicesRouter.post("/services/items", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.session.userId! } });
  if (!me) return res.status(404).json({ error: "USER_NOT_FOUND" });
  if (!["SHOP", "PROFESSIONAL"].includes(me.profileType)) {
    return res.status(403).json({ error: "NOT_ALLOWED" });
  }
  const { title, description, category, price } = req.body as Record<string, string>;
  if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

  const item = await prisma.serviceItem.create({
    data: {
      ownerId: me.id,
      title,
      description,
      category,
      price: price ? Number(price) : null
    }
  });
  return res.json({ item });
});

servicesRouter.post("/services/:userId/rating", requireAuth, async (req, res) => {
  const rating = Number(req.body?.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "INVALID_RATING" });
  }
  const profileId = req.params.userId;
  const raterId = req.session.userId!;
  const created = await prisma.serviceRating.upsert({
    where: { profileId_raterId: { profileId, raterId } },
    update: { rating },
    create: { profileId, raterId, rating }
  });
  return res.json({ rating: created });
});
