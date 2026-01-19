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
import { feedRouter } from "./feed/routes";
import { adminRouter } from "./admin/routes";
import { khipuRouter } from "./khipu/routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

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
  if (req.path === "/webhooks/khipu") {
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

// static uploads
app.use("/uploads", express.static(path.resolve(config.storageDir), { maxAge: "1h" }));

app.use("/auth", authRouter);
app.use("/", feedRouter);
app.use("/admin", adminRouter);
app.use("/", khipuRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

app.listen(config.port, () => {
  console.log(`[api] listening on :${config.port}`);
});
