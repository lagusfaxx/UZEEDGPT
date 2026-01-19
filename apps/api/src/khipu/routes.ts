import { Router } from "express";
import { prisma } from "../db";
import { config } from "../config";
import { requireAuth } from "../auth/middleware";
import { createPayment, getPayment } from "./client";
import { verifyKhipuSignature } from "./webhook";

export const khipuRouter = Router();

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

khipuRouter.post("/payments/create", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.session.userId! } });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

  const amount = Number(process.env.MEMBERSHIP_AMOUNT_CLP || 5000);
  const tx = `uzeed_${user.id}_${Date.now()}`;
  const created = await prisma.payment.create({
    data: {
      userId: user.id,
      providerPaymentId: "pending",
      transactionId: tx,
      status: "PENDING",
      amount,
      currency: "CLP"
    }
  });

  const payment = await createPayment({
    subject: "UZEED - Suscripción mensual",
    amount,
    currency: "CLP",
    transaction_id: tx,
    return_url: `${config.appUrl}/billing/return?payment_id=${encodeURIComponent(created.id)}`,
    cancel_url: `${config.appUrl}/billing/cancel?payment_id=${encodeURIComponent(created.id)}`,
    notify_url: `${config.apiUrl}/webhooks/khipu`,
    notify_api_version: "3.0",
    payer_email: user.email,
    custom: JSON.stringify({ internal_payment_id: created.id, user_id: user.id })
  });

  await prisma.payment.update({
    where: { id: created.id },
    data: { providerPaymentId: payment.payment_id }
  });

  return res.json({ id: created.id, providerPaymentId: payment.payment_id, paymentUrl: payment.payment_url });
});

khipuRouter.get("/payments/:id", requireAuth, async (req, res) => {
  const p = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!p || p.userId !== req.session.userId) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json({ payment: { ...p, amount: Number(p.amount), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() } });
});

// Webhook: Khipu sends POST with JSON body. We validate signature if present.
khipuRouter.post("/webhooks/khipu", async (req, res) => {
  // raw body is set by express raw middleware (see index.ts)
  const rawBody: Buffer | undefined = (req as any).rawBody;
  const sig = req.header("x-khipu-signature");
  if (sig) {
    const ok = rawBody ? verifyKhipuSignature(rawBody, sig) : false;
    if (!ok) return res.status(401).json({ error: "INVALID_SIGNATURE" });
  }

  const body = req.body as any;
  const paymentId = body?.payment_id || body?.notification_token || body?.paymentId;
  if (!paymentId) return res.status(400).json({ error: "MISSING_PAYMENT_ID" });

  const existing = await prisma.payment.findFirst({ where: { providerPaymentId: String(paymentId) } });
  if (!existing) return res.status(404).json({ error: "PAYMENT_NOT_FOUND" });

  // idempotent
  if (existing.status === "PAID") return res.json({ ok: true, status: "PAID" });

  await prisma.payment.update({ where: { id: existing.id }, data: { status: "VERIFYING" } });

  const status = await getPayment(String(paymentId));
  const paid = String(status.status).toLowerCase() === "done" || String(status.status).toLowerCase() === "paid";

  if (!paid) {
    await prisma.payment.update({ where: { id: existing.id }, data: { status: "FAILED" } });
    return res.json({ ok: true, status: "FAILED" });
  }

  await prisma.$transaction(async (txPrisma) => {
    await txPrisma.payment.update({ where: { id: existing.id }, data: { status: "PAID" } });
    const u = await txPrisma.user.findUnique({ where: { id: existing.userId }, select: { membershipExpiresAt: true } });
    const base = u?.membershipExpiresAt && u.membershipExpiresAt.getTime() > Date.now() ? u.membershipExpiresAt : new Date();
    const newExp = addDays(base, config.membershipDays);
    await txPrisma.user.update({ where: { id: existing.userId }, data: { membershipExpiresAt: newExp } });
  });

  return res.json({ ok: true, status: "PAID" });
});
