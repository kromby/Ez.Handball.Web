import type { Language } from "../api/types";

export const LANG_STORAGE_KEY = "ohf.lang";

const SUPPORTED: readonly Language[] = ["is", "en"];

function isLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED as readonly string[]).includes(value);
}

/** Read the anonymous-visitor language preference, or null if unset/invalid. */
export function readStoredLanguage(): Language | null {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    return isLanguage(raw) ? raw : null;
  } catch {
    // localStorage can throw in privacy modes; treat as "no preference".
    return null;
  }
}

/** Persist the anonymous-visitor language preference. */
export function writeStoredLanguage(language: Language): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, language);
  } catch {
    // Non-fatal: the in-memory language change still applies for this session.
  }
}
