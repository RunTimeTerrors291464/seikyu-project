import { describe, expect, it } from "vitest";

import en from "@/dictionaries/en.json";
import hu from "@/dictionaries/hu.json";
import vi from "@/dictionaries/vi.json";

import { translateUnitName } from "./translateUnitName";

describe("translateUnitName", () => {
  it("returns English unchanged", () => {
    expect(translateUnitName("pack/6 pieces", en)).toBe("pack/6 pieces");
  });

  it("translates composite unit names to Vietnamese", () => {
    expect(translateUnitName("pack/6 pieces", vi)).toBe("gói/6 cái");
    expect(translateUnitName("box/12 pieces", vi)).toBe("hộp/12 cái");
    expect(translateUnitName("roll/100 pieces", vi)).toBe("cuộn/100 cái");
    expect(translateUnitName("pack/10 rolls", vi)).toBe("gói/10 cuộn");
    expect(translateUnitName("10 metres", vi)).toBe("10 mét");
    expect(translateUnitName("10 meters", vi)).toBe("10 mét");
  });

  it("translates composite unit names to Hungarian", () => {
    expect(translateUnitName("pack/6 pieces", hu)).toBe("cs/6 db");
    expect(translateUnitName("box/12 pieces", hu)).toBe("doboz/12 db");
    expect(translateUnitName("pack/10 pairs", hu)).toBe("cs/10 pár");
    expect(translateUnitName("10 metres", hu)).toBe("10 m");
  });

  it("translates Hungarian token unit names", () => {
    expect(translateUnitName("6db/cs", vi)).toBe("6cái/gói");
    expect(translateUnitName("doboz/12db", vi)).toBe("hộp/12cái");
    expect(translateUnitName("100db/roll", vi)).toBe("100cái/cuộn");
    expect(translateUnitName("10m", vi)).toBe("10mét");
    expect(translateUnitName("cs/5pár", hu)).toBe("cs/5pár");
  });

  it("maps Hungarian tokens to English when locale is English", () => {
    expect(translateUnitName("6db/cs", en)).toBe("6piece/pack");
    expect(translateUnitName("10m", en)).toBe("10metre");
  });

  it("leaves unknown words unchanged", () => {
    expect(translateUnitName("carton/24 items", vi)).toBe("carton/24 items");
  });
});
