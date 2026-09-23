import bcrypt from "bcryptjs";
import { env, isDev } from "../../config/env.js";
import { query, withTransaction } from "../../db/pool.js";
import { AppError } from "../../middleware/errorHandler.js";
import { publicUser, signAccessToken } from "../../middleware/auth.js";
import { hashToken, randomToken, sixDigitCode } from "../../utils/tokens.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../utils/mailer.js";

const BCRYPT_ROUNDS = 12;
const VERIFY_TTL_MINUTES = 15;
const RESET_TTL_MINUTES = 60;

function normalizePhone(phone) {
  if (!phone) return null;
  if (phone.startsWith("+880")) return phone;
  if (phone.startsWith("01")) return `+88${phone}`;
  return phone;
}

function normalizeOptional(value) {
  return value?.trim() || null;
}

async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT u.*, t.tesla_number
     FROM users u LEFT JOIN teslas t ON t.driver_id = u.id
     WHERE u.email = $1`,
    [email],
  );
  return rows[0] || null;
}

async function issueVerification(user) {
  const code = sixDigitCode();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MINUTES * 60 * 1000);

  await query(
    `INSERT INTO email_verification_tokens (user_id, code_hash, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [user.id, hashToken(code), hashToken(token), expiresAt],
  );

  const verifyUrl = `${env.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
  const mail = await sendVerificationEmail({
    to: user.email,
    name: user.full_name,
    code,
    verifyUrl,
  });

  return {
    expiresAt,
    mocked: mail.mocked,
    ...(isDev && mail.mocked ? { devCode: code, devVerifyUrl: verifyUrl } : {}),
  };
}

export async function register(input) {
  const email = input.email;
  const phone = normalizePhone(input.phone);

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError(
      409,
      "EMAIL_TAKEN",
      "An account with this email already exists.",
    );
  }

  if (phone) {
    const { rows } = await query("SELECT id FROM users WHERE phone = $1", [
      phone,
    ]);
    if (rows[0]) {
      throw new AppError(
        409,
        "PHONE_TAKEN",
        "An account with this phone number already exists.",
      );
    }
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, passwordHash, input.fullName, phone, input.role],
    );
    const created = rows[0];
    await client.query(
      "INSERT INTO wallets (user_id, balance_paisa) VALUES ($1, 0)",
      [created.id],
    );

    if (input.role === "driver") {
      await client.query(
        `INSERT INTO teslas (driver_id, name, capacity, ops_status)
         VALUES ($1, $2, 3, 'offline')`,
        [created.id, `${created.full_name.split(" ")[0]}'s Tesla`],
      );
    }

    return created;
  });

  const verification = await issueVerification(user);

  return {
    user: publicUser(user),
    message:
      "Account created. Check your email for a 6-digit verification code.",
    verification: {
      expiresAt: verification.expiresAt,
      ...(verification.devCode
        ? {
            devCode: verification.devCode,
            devVerifyUrl: verification.devVerifyUrl,
          }
        : {}),
    },
  };
}

export async function verifyEmailWithCode({ email, code }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(400, "INVALID_CODE", "That code is invalid or expired.");
  }
  if (user.email_verified_at) {
    return {
      user: publicUser(user),
      token: signAccessToken(user),
      alreadyVerified: true,
    };
  }

  const { rows } = await query(
    `SELECT * FROM email_verification_tokens
     WHERE user_id = $1 AND consumed_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 5`,
    [user.id],
  );

  const match = rows.find((row) => row.code_hash === hashToken(code));
  if (!match) {
    throw new AppError(400, "INVALID_CODE", "That code is invalid or expired.");
  }

  await query(
    "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1",
    [match.id],
  );
  const { rows: updated } = await query(
    `UPDATE users SET email_verified_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [user.id],
  );

  const verified = updated[0];
  return { user: publicUser(verified), token: signAccessToken(verified) };
}

export async function verifyEmailWithToken(token) {
  const tokenHash = hashToken(token);
  const { rows } = await query(
    `SELECT t.*, u.email_verified_at, u.id AS user_id
     FROM email_verification_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row || new Date(row.expires_at) < new Date()) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "That verification link is invalid or expired.",
    );
  }

  if (row.consumed_at) {
    const { rows: existing } = await query(
      "SELECT * FROM users WHERE id = $1",
      [row.user_id],
    );
    const user = existing[0];
    if (user?.email_verified_at) {
      return {
        user: publicUser(user),
        token: signAccessToken(user),
        alreadyVerified: true,
      };
    }
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "That verification link is invalid or expired.",
    );
  }

  await query(
    "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1",
    [row.id],
  );

  const { rows: updated } = await query(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [row.user_id],
  );

  const verified = updated[0];
  return { user: publicUser(verified), token: signAccessToken(verified) };
}

export async function resendVerification(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    return {
      message: "If that email is registered, a new code is on its way.",
    };
  }
  if (user.email_verified_at) {
    return { message: "This email is already verified. You can sign in." };
  }

  const { rows: recent } = await query(
    `SELECT created_at FROM email_verification_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  if (
    recent[0] &&
    Date.now() - new Date(recent[0].created_at).getTime() < 60_000
  ) {
    throw new AppError(
      429,
      "TOO_MANY_REQUESTS",
      "Wait a minute before requesting another code.",
    );
  }

  const verification = await issueVerification(user);
  return {
    message: "A new verification code has been sent.",
    ...(verification.devCode
      ? { verification: { devCode: verification.devCode } }
      : {}),
  };
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }

  if (!user.email_verified_at) {
    const verification = await issueVerification(user);
    throw new AppError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before signing in. We sent a new code.",
      verification.devCode ? { devCode: verification.devCode } : undefined,
    );
  }

  return { user: publicUser(user), token: signAccessToken(user) };
}

export async function forgotPassword(email) {
  const generic = {
    message: "If that email is registered, a reset link is on its way.",
  };
  const user = await findUserByEmail(email);
  if (!user) {
    return generic;
  }

  const { rows: recent } = await query(
    `SELECT created_at FROM password_reset_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  if (
    recent[0] &&
    Date.now() - new Date(recent[0].created_at).getTime() < 60_000
  ) {
    return generic;
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashToken(token), expiresAt],
  );

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
  const mail = await sendPasswordResetEmail({
    to: user.email,
    name: user.full_name,
    resetUrl,
  });

  return {
    ...generic,
    ...(isDev && mail.mocked ? { devResetUrl: resetUrl } : {}),
  };
}

export async function resetPassword({ token, password }) {
  const { rows } = await query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row || row.consumed_at || new Date(row.expires_at) < new Date()) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "That reset link is invalid or expired.",
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, row.user_id],
    );
    await client.query(
      "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = $1",
      [row.id],
    );
    await client.query(
      `UPDATE password_reset_tokens SET consumed_at = NOW()
       WHERE user_id = $1 AND consumed_at IS NULL AND id <> $2`,
      [row.user_id, row.id],
    );
  });

  return { message: "Password updated. You can sign in now." };
}

export async function updateProfile(userId, role, input) {
  const phone = normalizePhone(normalizeOptional(input.phone));
  const teslaNumber = normalizeOptional(input.teslaNumber);

  if (phone) {
    const { rows } = await query(
      "SELECT id FROM users WHERE phone = $1 AND id <> $2",
      [phone, userId],
    );
    if (rows[0])
      throw new AppError(
        409,
        "PHONE_TAKEN",
        "That phone number is already in use.",
      );
  }
  if (role === "driver" && teslaNumber) {
    const { rows } = await query(
      "SELECT driver_id FROM teslas WHERE tesla_number = $1 AND driver_id <> $2",
      [teslaNumber, userId],
    );
    if (rows[0])
      throw new AppError(
        409,
        "TESLA_NUMBER_TAKEN",
        "That Tesla number is already in use.",
      );
  }

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users
       SET full_name = $1, phone = $2, nid = $3, date_of_birth = $4, address = $5, updated_at = NOW()
       WHERE id = $6`,
      [
        input.fullName,
        phone,
        normalizeOptional(input.nid),
        normalizeOptional(input.dateOfBirth),
        normalizeOptional(input.address),
        userId,
      ],
    );

    if (role === "driver") {
      await client.query(
        "UPDATE teslas SET tesla_number = $1 WHERE driver_id = $2",
        [teslaNumber, userId],
      );
    }
  });

  const { rows } = await query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.nid, u.date_of_birth,
            u.address, u.email_verified_at, u.created_at, t.tesla_number
     FROM users u LEFT JOIN teslas t ON t.driver_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  return { user: publicUser(rows[0]), message: "Profile updated." };
}
