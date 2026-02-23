import { describe, expect, it } from "vitest";
import { validateContentUpdate } from "../src/lib/validation.js";

describe("content update validator", () => {
  it("accepts valid hero content", () => {
    const result = validateContentUpdate({
      key: "hero",
      data: {
        badge: "Available now",
        titlePrefix: "Architecting",
        titleHighlight: "Digital Products",
        description: "We build robust and scalable software with production-grade architecture.",
        primaryCtaLabel: "View Work",
        primaryCtaTarget: "#projects",
        secondaryCtaLabel: "Contact",
        secondaryCtaTarget: "#contact",
        techPills: ["Next.js", "Node.js"],
      },
    });
    expect(result.ok).toBe(true);
  });

  it("rejects unknown content key", () => {
    const result = validateContentUpdate({
      key: "unknown",
      data: {},
    });
    expect(result.ok).toBe(false);
  });
});
