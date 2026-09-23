import { z } from "zod";
import { AppError } from "../../middleware/errorHandler.js";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  fullName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Use a Bangladeshi mobile number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["passenger", "driver"]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const verifyTokenSchema = z.object({
  token: z.string().trim().min(16),
});

export const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetSchema = z.object({
  token: z.string().trim().min(16),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Use a Bangladeshi mobile number")
    .optional()
    .or(z.literal("")),
  nid: z.string().trim().max(30).optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  teslaNumber: z.string().trim().max(40).optional().or(z.literal("")),
});

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Check the highlighted fields.",
          parsed.error.flatten(),
        ),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}
