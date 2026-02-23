import { describe, expect, it } from "vitest";
import { validateLoginPayload, validateRegisterPayload } from "../src/lib/validation.js";

describe("auth payload validators", () => {
  it("accepts valid register payload", () => {
    const result = validateRegisterPayload({
      name: "Admin",
      email: "admin@example.com",
      password: "Secure123",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects weak register password", () => {
    const result = validateRegisterPayload({
      name: "Admin",
      email: "admin@example.com",
      password: "short",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts valid login payload", () => {
    const result = validateLoginPayload({
      email: "admin@example.com",
      password: "Secure123",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid login payload", () => {
    const result = validateLoginPayload({
      email: "bad-email",
      password: "",
    });
    expect(result.ok).toBe(false);
  });
});
