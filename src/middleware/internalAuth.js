import { env } from "../config/env.js";
import { HttpError } from "../lib/errors.js";

export const requireInternalToken = (req, _res, next) => {
  if (!env.CONTACT_INTERNAL_CRON_SECRET) {
    return next(new HttpError(503, "INTERNAL_ROUTE_DISABLED", "Internal worker secret is not configured."));
  }

  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token !== env.CONTACT_INTERNAL_CRON_SECRET) {
    return next(new HttpError(401, "UNAUTHORIZED", "Unauthorized internal request."));
  }

  return next();
};