import { describe, expect, it } from "vitest";
import { ratingLabel } from "./ratingLabel";

describe("ratingLabel", () => {
  it("rounds a positive rating", () => { expect(ratingLabel(83.6)).toBe("84"); });
  it("returns an en-dash for 0", () => { expect(ratingLabel(0)).toBe("–"); });
  it("returns an en-dash for null/undefined", () => {
    expect(ratingLabel(null)).toBe("–");
    expect(ratingLabel(undefined)).toBe("–");
  });
});
