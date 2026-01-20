import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth/middleware";

export const messagesRouter = Router();

messagesRouter.get("/messages/:userId", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const other = req.params.userId;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromId: me, toId: other },
        { fromId: other, toId: me }
      ]
    },
    orderBy: { createdAt: "asc" },
    take: 200
  });
  return res.json({ messages });
});

messagesRouter.post("/messages/:userId", requireAuth, async (req, res) => {
  const me = req.session.userId!;
  const other = req.params.userId;
  const body = String(req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "EMPTY_MESSAGE" });
  const message = await prisma.message.create({
    data: {
      fromId: me,
      toId: other,
      body
    }
  });
  return res.json({ message });
});
