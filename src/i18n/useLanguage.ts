import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { resolveLanguage } from "./resolveLanguage";
import { writeStoredLanguage } from "./languageStorage";

/** Reconcile i18next with the resolved language, and keep <html lang> in sync. Mount ONCE (in App). */
export function useLanguageSync(): void {
  const { i18n } = useTranslation();
  const { status, user } = useAuth();

  useEffect(() => {
    const resolved = resolveLanguage(status, user);
    if (i18n.language !== resolved) void i18n.changeLanguage(resolved);
  }, [i18n, status, user]);

  useEffect(() => {
    const apply = (lng: string) => {
      document.documentElement.lang = lng;
    };
    apply(i18n.language);
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, [i18n]);
}

/** Read + change the active language; persists locally and to the account. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const { status, updateProfile } = useAuth();

  const setLanguage = useCallback(
    async (next: Language) => {
      void i18n.changeLanguage(next);
      writeStoredLanguage(next);
      if (status === "authenticated") {
        try {
          await updateProfile({ language: next });
        } catch {
          // Keep the in-session change even if the save fails.
        }
      }
    },
    [i18n, status, updateProfile],
  );

  return { language: i18n.language as Language, setLanguage };
}
