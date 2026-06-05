import { useTranslation } from "react-i18next";
import type { Language } from "../api/types";
import { useLanguage } from "../i18n/useLanguage";
import { SketchBox } from "./SketchBox";

const LANGS: [Language, string][] = [
  ["is", "IS"],
  ["en", "EN"],
];

/** Compact IS/EN switch shown in the Nav for everyone. */
export function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return (
    <div className="nav-lang" role="group" aria-label={t("nav.language")}>
      {LANGS.map(([code, label]) => {
        const on = language === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => setLanguage(code)}
            style={{ all: "unset", cursor: "pointer" }}
          >
            <SketchBox tone={on ? "ink" : "paper"} radius={999} pad="4px 10px">
              <span style={{ fontWeight: 700, fontSize: 12, color: on ? "var(--paper-2)" : "var(--ink-2)" }}>
                {label}
              </span>
            </SketchBox>
          </button>
        );
      })}
    </div>
  );
}
