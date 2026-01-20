import { Router } from "express";
import argon2 from "argon2";
import { prisma } from "../db";
import { loginInputSchema, registerInputSchema } from "@uzeed/shared";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const { email, password, displayName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "EMAIL_IN_USE" });

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName: displayName || null, role: "USER" },
    select: { id: true, email: true, displayName: true, role: true, membershipExpiresAt: true }
  });

  req.session.userId = user.id;
  req.session.role = user.role;
  return res.json({ user: { ...user, membershipExpiresAt: user.membershipExpiresAt?.toISOString() || null } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION", details: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  req.session.userId = user.id;
  req.session.role = user.role;

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      membershipExpiresAt: user.membershipExpiresAt?.toISOString() || null
    }
  });
});

authRouter.post("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "LOGOUT_FAILED" });
    res.clearCookie("uzeed_session");
    return res.json({ ok: true });
  });
});

authRouter.get("/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, email: true, displayName: true, role: true, membershipExpiresAt: true }
  });
  if (!user) return res.json({ user: null });
  return res.json({
    user: { ...user, membershipExpiresAt: user.membershipExpiresAt?.toISOString() || null }
  });
});
