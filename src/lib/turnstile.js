import { env } from "../config/env.js";

const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstileToken = async ({ token, ip }) => {
  if (!env.TURNSTILE_SECRET_KEY) {
    return { success: true, skipped: true };
  }

  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  const response = await fetch(TURNSTILE_ENDPOINT, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return {
      success: false,
      reason: "turnstile_unavailable",
      statusCode: response.status,
    };
  }

  const payload = await response.json();
  return {
    success: Boolean(payload.success),
    reason: payload["error-codes"]?.join(",") ?? "invalid_token",
    hostname: payload.hostname,
  };
};