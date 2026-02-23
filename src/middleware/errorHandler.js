import { HttpError, RateLimitError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { Sentry } from "../lib/sentry.js";

export const errorHandler = (err, req, res, _next) => {
  if (!(err instanceof HttpError)) {
    logger.error(
      {
        event: "contact.unhandled_error",
        path: req.path,
        method: req.method,
        message: err?.message,
      },
      err
    );
    if (Sentry.captureException) {
      Sentry.captureException(err);
    }
  }

  const status = err instanceof HttpError ? err.status : 500;
  const code = err instanceof HttpError ? err.code : "INTERNAL_ERROR";

  const body = {
    code,
    message:
      status >= 500
        ? "Something went wrong. Please try again later."
        : err.message,
  };

  if (err instanceof ValidationError) {
    body.fieldErrors = err.details.fieldErrors;
  }

  if (err instanceof RateLimitError) {
    body.retryAfterSeconds = err.details.retryAfterSeconds;
    res.set("Retry-After", String(err.details.retryAfterSeconds));
  }

  res.status(status).json(body);
};