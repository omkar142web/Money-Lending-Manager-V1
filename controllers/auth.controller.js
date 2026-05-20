import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { clearAuthCookies, setAuthCookies } from "../middleware/requireAuth.js";
import {
  authenticateUser,
  clearSession,
  createSession,
  createUser,
} from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const getLogin = (req, res) => {
  res.render("login");
};

export const getRegister = (req, res) => {
  res.render("register");
};

export const postLogin = asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.validatedBody.email, req.validatedBody.password);
  const token = await createSession(user._id);

  clearAuthCookies(res);
  setAuthCookies(res, user._id, token);

  return sendSuccess(res, { redirect: "/" }, "Logged in successfully.");
});

export const postRegister = asyncHandler(async (req, res) => {
  const user = await createUser(req.validatedBody);
  const token = await createSession(user._id);

  setAuthCookies(res, user._id, token);

  return sendSuccess(res, { redirect: "/" }, "Account created successfully.", 201);
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.cookies[env.userCookieName];
  const token = req.cookies[env.sessionCookieName];

  await clearSession(userId, token);
  clearAuthCookies(res);

  return res.redirect("/login");
});
