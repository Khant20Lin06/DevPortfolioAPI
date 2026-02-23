import { HttpError } from "../lib/errors.js";
import { verifyAuthToken } from "../lib/authToken.js";

const getBearerToken = (headerValue = "") => {
  if (!headerValue.startsWith("Bearer ")) return "";
  return headerValue.slice(7);
};

export const requireAuth = (req, _res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    next(new HttpError(401, "UNAUTHORIZED", "Authentication required."));
    return;
  }

  try {
    const claims = verifyAuthToken(token);
    req.auth = {
      userId: claims.sub,
      email: claims.email,
      role: claims.role,
    };
    next();
  } catch (_error) {
    next(new HttpError(401, "UNAUTHORIZED", "Invalid or expired token."));
  }
};

export const requireAdmin = (req, _res, next) => {
  if (!req.auth || req.auth.role !== "admin") {
    next(new HttpError(403, "FORBIDDEN", "Admin access required."));
    return;
  }
  next();
};

export const requireUserRole = (req, _res, next) => {
  if (!req.auth || req.auth.role !== "user") {
    next(new HttpError(403, "FORBIDDEN", "User access required."));
    return;
  }
  next();
};
