import type { AuthStatus } from "../auth/useAuth";
import type { AuthUser, Language } from "../api/types";
import { readStoredLanguage } from "./languageStorage";

export const DEFAULT_LANGUAGE: Language = "is";

/**
 * Pick the active UI language. A logged-in user's saved preference is
 * authoritative; otherwise the anonymous localStorage choice; otherwise
 * Icelandic, the primary language. No browser detection (by design).
 */
export function resolveLanguage(status: AuthStatus, user: AuthUser | null): Language {
  if (status === "authenticated" && user) return user.language;
  return readStoredLanguage() ?? DEFAULT_LANGUAGE;
}
