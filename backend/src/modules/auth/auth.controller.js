import { asyncHandler } from "../../middleware/errorHandler.js";
import { publicUser, requireAuth } from "../../middleware/auth.js";
import {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendSchema,
  forgotSchema,
  resetSchema,
  profileSchema,
} from "./auth.validators.js";
import * as authService from "./auth.service.js";

export const register = [
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    res.status(201).json(data);
  }),
];

export const login = [
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.json(data);
  }),
];

export const verifyEmail = [
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.verifyEmailWithCode(req.body);
    res.json(data);
  }),
];

export const verifyEmailLink = asyncHandler(async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) {
    res
      .status(400)
      .json({ error: { code: "VALIDATION_ERROR", message: "Missing token." } });
    return;
  }
  const data = await authService.verifyEmailWithToken(token);
  res.json(data);
});

export const resend = [
  validate(resendSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.resendVerification(req.body.email);
    res.json(data);
  }),
];

export const forgot = [
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.forgotPassword(req.body.email);
    res.json(data);
  }),
];

export const reset = [
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.resetPassword(req.body);
    res.json(data);
  }),
];

export const me = [
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  }),
];

export const updateProfile = [
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const data = await authService.updateProfile(
      req.user.id,
      req.user.role,
      req.body,
    );
    res.json(data);
  }),
];
