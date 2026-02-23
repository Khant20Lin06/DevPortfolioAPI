import { env } from "../config/env.js";

let Sentry = {
  captureException: null,
};

if (env.SENTRY_DSN) {
  const sentryModule = await import("@sentry/node");
  Sentry = sentryModule;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

export { Sentry };
