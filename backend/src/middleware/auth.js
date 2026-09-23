import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { AppError, asyncHandler } from "./errorHandler.js";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    throw new AppError(401, "UNAUTHENTICATED", "Sign in required.");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Session expired. Sign in again.",
    );
  }

  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.nid, u.date_of_birth,
            u.address, u.email_verified_at, u.created_at, t.tesla_number
     FROM users u
     LEFT JOIN teslas t ON t.driver_id = u.id
     WHERE u.id = $1`,
    [payload.sub],
  );
  const user = rows[0];
  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Account no longer exists.");
  }
  if (!user.email_verified_at) {
    throw new AppError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before continuing.",
    );
  }

  req.user = user;
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "You cannot perform this action."));
      return;
    }
    next();
  };
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    nid: row.nid || null,
    dateOfBirth: row.date_of_birth || null,
    address: row.address || null,
    teslaNumber: row.tesla_number || null,
    role: row.role,
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at,
  };
}
