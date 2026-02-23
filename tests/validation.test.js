import { describe, expect, it } from "vitest";
import { validateContactPayload } from "../src/lib/validation.js";

describe("validateContactPayload", () => {
  it("accepts valid payload", () => {
    const result = validateContactPayload({
      name: "John Doe",
      email: "john@example.com",
      message: "This is a sufficiently long message for the validation rules.",
      captchaToken: "token-123",
    });

    expect(result.ok).toBe(true);
  });

  it("returns field errors for invalid payload", () => {
    const result = validateContactPayload({
      name: "J",
      email: "bad-email",
      message: "short",
      captchaToken: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeTruthy();
      expect(result.fieldErrors.email).toBeTruthy();
      expect(result.fieldErrors.message).toBeTruthy();
      expect(result.fieldErrors.captchaToken).toBeTruthy();
    }
  });
});