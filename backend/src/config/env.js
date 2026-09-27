import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: required(
    "DATABASE_URL",
    "postgres://postgres:postgres@localhost:5432/dhaka_tesla_pool",
  ),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
  mailFrom:
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    "Dhaka Tesla Pool <noreply@localhost>",
  stripeSecretKey: (process.env.STRIPE_SECRET_KEY || "").trim(),
  stripePublishableKey: (
    process.env.STRIPE_PUBLISHABLE_KEY ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    ""
  ).trim(),
  stripeDummyMode: process.env.STRIPE_DUMMY_MODE === "true",
};

export const isDev = env.nodeEnv !== "production";
