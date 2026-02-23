import { describe, expect, it } from "vitest";
import { scoreSpamSignal } from "../src/lib/spam.js";

describe("scoreSpamSignal", () => {
  it("quarantines obvious abuse", () => {
    const result = scoreSpamSignal({
      message: "GET RICH FAST http://spam.test http://spam2.test",
      website: "filled-by-bot",
      ipDayCount: 15,
      emailDayCount: 4,
      duplicateRecent: true,
    });

    expect(result.quarantine).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("keeps normal messages accepted", () => {
    const result = scoreSpamSignal({
      message: "Hello, I would like to discuss a new dashboard project for our team.",
      website: "",
      ipDayCount: 0,
      emailDayCount: 0,
      duplicateRecent: false,
    });

    expect(result.quarantine).toBe(false);
  });
});