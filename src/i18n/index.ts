import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import is from "./locales/is.json";
import { readStoredLanguage } from "./languageStorage";
import { DEFAULT_LANGUAGE } from "./resolveLanguage";

export const resources = {
  en: { translation: en },
  is: { translation: is },
} as const;

// Best initial guess before auth resolves; useLanguageSync reconciles after.
const initialLanguage = readStoredLanguage() ?? DEFAULT_LANGUAGE;

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ["is", "en"],
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },         // resources are bundled; render synchronously
  })
  .catch(() => {
    // Bundled resources initialise synchronously; a rejection here is non-fatal.
  });

export const i18n = i18next;
export default i18next;
