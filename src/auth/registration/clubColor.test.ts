import { describe, expect, test } from "vitest";
import { clubColor, clubMonogram } from "./clubColor";

describe("clubColor", () => {
  test("is deterministic for the same id", () => {
    expect(clubColor("385")).toBe(clubColor("385"));
  });

  test("returns a hex colour from the palette", () => {
    expect(clubColor("412")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("clubMonogram", () => {
  test("uses first letters of the first and last words", () => {
    expect(clubMonogram("Fram Reykjavik")).toBe("FR");
  });

  test("uses the first two letters of a single word", () => {
    expect(clubMonogram("Afturelding")).toBe("AF");
  });

  test("falls back to ? when blank", () => {
    expect(clubMonogram("   ")).toBe("?");
  });
});
