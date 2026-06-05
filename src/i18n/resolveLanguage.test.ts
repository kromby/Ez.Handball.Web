import { afterEach, describe, expect, test } from "vitest";
import { resolveLanguage } from "./resolveLanguage";
import { writeStoredLanguage } from "./languageStorage";
import type { AuthUser } from "../api/types";

const user = (language: "is" | "en"): AuthUser => ({
  id: "u1", email: "a@b.is", displayName: "Jon", language,
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
});

afterEach(() => localStorage.clear());

describe("resolveLanguage", () => {
  test("uses the authenticated user's language above all", () => {
    writeStoredLanguage("is");
    expect(resolveLanguage("authenticated", user("en"))).toBe("en");
  });

  test("falls back to stored language when anonymous", () => {
    writeStoredLanguage("en");
    expect(resolveLanguage("anonymous", null)).toBe("en");
  });

  test("defaults to Icelandic when nothing is known", () => {
    expect(resolveLanguage("anonymous", null)).toBe("is");
  });

  test("defaults to Icelandic while auth is loading with no stored value", () => {
    expect(resolveLanguage("loading", null)).toBe("is");
  });
});
