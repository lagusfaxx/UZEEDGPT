import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  appUrl: required("APP_URL"),
  apiUrl: required("API_URL"),
  corsOrigin: process.env.CORS_ORIGIN || required("APP_URL"),
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),
  cookieDomain: process.env.COOKIE_DOMAIN,
  khipuReceiverId: required("KHIPU_RECEIVER_ID"),
  khipuSecret: required("KHIPU_SECRET"),
  khipuBaseUrl: process.env.KHIPU_BASE_URL || "https://khipu.com/api/3.0",
  membershipDays: Number(process.env.MEMBERSHIP_DAYS || 30),
  storageDir: process.env.STORAGE_DIR || "./uploads",
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
  }
};
