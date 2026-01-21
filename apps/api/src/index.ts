import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import session from "express-session";
import pg from "pg";
import PgSession from "connect-pg-simple";
import path from "path";

import { config } from "./config";
import { authRouter } from "./auth/routes";
import { ensureAdminUser } from "./auth/seedAdmin";
import { feedRouter } from "./feed/routes";
import { adminRouter } from "./admin/routes";
import { khipuRouter } from "./khipu/routes";
import { profileRouter } from "./profile/routes";
import { servicesRouter } from "./services/routes";
import { messagesRouter } from "./messages/routes";
import { creatorRouter } from "./creator/routes";
import { billingRouter } from "./billing/routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: config.corsOrigin.split(",").map((s) => s.trim()),
  credentials: true
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(cookieParser());

// JSON body, except for webhook where we need raw body for signature
app.use((req, res, next) => {
  if (req.path.startsWith("/webhooks/khipu")) {
    express.raw({ type: "application/json" })(req, res, (err) => {
      if (err) return next(err);
      (req as any).rawBody = req.body;
      try {
        req.body = JSON.parse((req.body as Buffer).toString("utf8"));
      } catch {
        req.body = {};
      }
      return next();
    });
  } else {
    express.json({ limit: "2mb" })(req, res, next);
  }
});

const pgPool = new pg.Pool({ connectionString: config.databaseUrl });
const PgStore = PgSession(session);

app.use(
  session({
    name: "uzeed_session",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.env !== "development",
      domain: config.cookieDomain,
      maxAge: 1000 * 60 * 60 * 24 * 30
    },
    store: new PgStore({ pool: pgPool, tableName: "session", createTableIfMissing: true })
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/version", (_req, res) => res.json({ sha: process.env.GIT_SHA || "unknown" }));

// static uploads
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.resolve(config.storageDir), { maxAge: "1h" })
);

app.use("/auth", authRouter);
app.use("/", feedRouter);
app.use("/admin", adminRouter);
app.use("/", khipuRouter);
app.use("/", profileRouter);
app.use("/", servicesRouter);
app.use("/", messagesRouter);
app.use("/", creatorRouter);
app.use("/", billingRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err?.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: "INVALID_FILE_TYPE" });
  }
  if (err?.message === "FILE_TOO_LARGE") {
    return res.status(400).json({ error: "FILE_TOO_LARGE" });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "FILE_TOO_LARGE" });
  }
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

ensureAdminUser()
  .catch((err) => console.error("[api] admin seed failed", err))
  .finally(() => {
    app.listen(config.port, () => {
      console.log(`[api] listening on :${config.port}`);
    });
  });
