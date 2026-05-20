import { env, isProduction } from "../config/env.js";
import { findUserById, verifySessionToken } from "../services/auth.service.js";

export function getAuthCookieOptions() {
  const oneMonthMs = env.cookieMaxAgeDays * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    // Use both maxAge and expires for better compatibility
    maxAge: oneMonthMs,
    expires: new Date(Date.now() + oneMonthMs),
  };
}

export function setAuthCookies(res, userId, token) {
  const options = getAuthCookieOptions();
  res.cookie(env.userCookieName, userId.toString(), options);
  res.cookie(env.sessionCookieName, token, options);
}

export function clearAuthCookies(res) {
  res.clearCookie(env.userCookieName);
  res.clearCookie(env.sessionCookieName);
  res.clearCookie("name");
  res.clearCookie("email");
  res.clearCookie("password");
}

function isApiRequest(req) {
  return req.originalUrl.startsWith("/api/");
}

export async function requireAuth(req, res, next) {
  try {
    const userId = req.cookies[env.userCookieName];
    const token = req.cookies[env.sessionCookieName];

    if (!userId || !token) {
      clearAuthCookies(res);
      return isApiRequest(req)
        ? res.status(401).json({ success: false, message: "Authentication required." })
        : res.redirect("/login");
    }

    const user = await findUserById(userId);

    if (!user || !verifySessionToken(user, token)) {
      clearAuthCookies(res);
      return isApiRequest(req)
        ? res.status(401).json({ success: false, message: "Authentication required." })
        : res.redirect("/login");
    }

    // Extend the session on each request (Sliding Session)
    setAuthCookies(res, userId, token);

    req.user = user;
    next();
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}
