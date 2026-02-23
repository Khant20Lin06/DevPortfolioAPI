import { z } from "zod";

const fieldErrorsFromZod = (issues) => {
  const fieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long"),
  email: z.string().trim().email("Invalid email address").max(320, "Email is too long"),
  message: z.string().trim().min(10, "Message is too short").max(2000, "Message is too long"),
});

export const validateContactPayload = (input) => {
  const parsed = contactSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long").optional(),
  email: z.string().trim().email("Invalid email address").max(320, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const messageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000, "Message is too long"),
});

const reactionSchema = z.object({
  emoji: z
    .string()
    .trim()
    .max(16, "Emoji is too long")
    .optional()
    .nullable(),
});

export const validateRegisterPayload = (input) => {
  const parsed = registerSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
};

export const validateLoginPayload = (input) => {
  const parsed = loginSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
};

export const validateMessagePayload = (input) => {
  const parsed = messageSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
};

export const validateReactionPayload = (input) => {
  const parsed = reactionSchema.safeParse(input);
  if (parsed.success) {
    const value = parsed.data?.emoji;
    return { ok: true, data: { emoji: typeof value === "string" ? value.trim() : "" } };
  }
  return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
};

export const validateContentUpdate = ({ key, data }) => {
  if (!key || typeof key !== "string") {
    return {
      ok: false,
      fieldErrors: {
        key: "Content key is required.",
      },
    };
  }

  return { ok: true, data };
};
