import { describe, expect, it } from "vitest";

import { parseBooleanEnv } from "@/lib/config/featureFlags";

describe("parseBooleanEnv", () => {
  it("uses the fallback when the value is absent or invalid", () => {
    expect(parseBooleanEnv(undefined, true)).toBe(true);
    expect(parseBooleanEnv("", false)).toBe(false);
    expect(parseBooleanEnv("unexpected", true)).toBe(true);
  });

  it("accepts common true and false values case-insensitively", () => {
    expect(parseBooleanEnv(" TRUE ", false)).toBe(true);
    expect(parseBooleanEnv("1", false)).toBe(true);
    expect(parseBooleanEnv("off", true)).toBe(false);
    expect(parseBooleanEnv("No", true)).toBe(false);
  });
});
