import { afterEach, describe, expect, test } from "vitest";
import { readStoredLanguage, writeStoredLanguage, LANG_STORAGE_KEY } from "./languageStorage";

afterEach(() => localStorage.clear());

describe("languageStorage", () => {
  test("returns null when nothing is stored", () => {
    expect(readStoredLanguage()).toBeNull();
  });

  test("round-trips a valid language", () => {
    writeStoredLanguage("en");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("en");
    expect(readStoredLanguage()).toBe("en");
  });

  test("ignores an unsupported stored value", () => {
    localStorage.setItem(LANG_STORAGE_KEY, "de");
    expect(readStoredLanguage()).toBeNull();
  });
});
