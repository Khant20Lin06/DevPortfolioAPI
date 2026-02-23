import { env } from "../config/env.js";
import { HttpError, ValidationError } from "../lib/errors.js";
import { normalizeEmail, normalizeText } from "../lib/hash.js";
import { logger } from "../lib/logger.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAuthToken } from "../lib/authToken.js";
import { validateLoginPayload, validateRegisterPayload } from "../lib/validation.js";
import { createUser, ensureAdminUser, findUserByEmail, findUserById } from "../repositories/authRepository.js";

const toSafeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const assertAuthEnabled = () => {
  if (!env.FEATURE_AUTH_ENABLED) {
    throw new HttpError(503, "FEATURE_DISABLED", "Authentication is temporarily unavailable.");
  }
};

export const registerUser = async (payload) => {
  assertAuthEnabled();

  const parsed = validateRegisterPayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const email = normalizeEmail(parsed.data.email);
  const name =
    parsed.data.name && parsed.data.name.trim().length > 0
      ? normalizeText(parsed.data.name)
      : "default-user";

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new HttpError(409, "EMAIL_IN_USE", "Email is already registered.");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await createUser({
    email,
    name,
    passwordHash,
    role: "user",
  });

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user: toSafeUser(user) };
};

export const loginUser = async (payload) => {
  assertAuthEnabled();

  const parsed = validateLoginPayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await findUserByEmail(email);
  if (!user) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new HttpError(403, "USER_DISABLED", "Your account is disabled.");
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user: toSafeUser(user) };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    throw new HttpError(401, "UNAUTHORIZED", "User not found or inactive.");
  }
  return toSafeUser(user);
};

export const ensureConfiguredAdmin = async () => {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    logger.info({
      event: "auth.seed_admin.skipped",
      reason: "missing_config",
    });
    return;
  }

  const adminEmail = normalizeEmail(env.ADMIN_SEED_EMAIL);
  const adminName = "Platform Admin";
  const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);

  const admin = await ensureAdminUser({
    email: adminEmail,
    name: adminName,
    passwordHash,
  });

  logger.info({
    event: "auth.seed_admin.ready",
    userId: admin.id,
    email: admin.email,
  });
};
