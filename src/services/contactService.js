import { ValidationError } from "../lib/errors.js";
import { normalizeEmail, normalizeText } from "../lib/hash.js";
import { validateContactPayload } from "../lib/validation.js";
import { emitToAdmins } from "../lib/realtime.js";
import { notifyAdmins } from "./notificationService.js";
import { createContactMessage } from "../repositories/contactRepository.js";

export const submitContactMessage = async ({ payload }) => {
  const parsed = validateContactPayload(payload);
  if (!parsed.ok) {
    throw new ValidationError(parsed.fieldErrors);
  }

  const name = normalizeText(parsed.data.name);
  const email = normalizeEmail(parsed.data.email);
  const message = normalizeText(parsed.data.message);

  const created = await createContactMessage({
    name,
    email,
    message,
  });

  emitToAdmins("contact:new", {
    id: created.id,
    name: created.name,
    email: created.email,
    message: created.message,
    createdAt: created.createdAt,
  });
  emitToAdmins("notification:new", {
    type: "contact",
    title: "New contact message",
    body: `${created.name} (${created.email}) sent a message`,
    createdAt: created.createdAt,
    data: { contactId: created.id },
  });
  await notifyAdmins({
    type: "contact",
    title: "New contact message",
    body: `${created.name} (${created.email}) sent a message`,
    data: { contactId: created.id },
  });

  return {
    submissionId: created.id,
    status: "received",
    message: "Thanks, your message has been received.",
  };
};
