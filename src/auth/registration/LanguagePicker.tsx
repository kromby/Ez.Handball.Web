import type { Language } from "../../api/types";
import { SketchBox } from "../../components/SketchBox";

// The backend accepts only "is" and "en"; the picker offers exactly those.
const LANGS: [Language, string][] = [
  ["is", "Íslenska"],
  ["en", "English"],
];

/** Pencil chips for the language preference (replaces a native select). */
export function LanguagePicker({ value, onChange }: { value: Language; onChange: (value: Language) => void }) {
  return (
    <div className="reg-lang" role="group" aria-label="Language">
      {LANGS.map(([code, name]) => {
        const on = value === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(code)}
            style={{ all: "unset", cursor: "pointer" }}
          >
            <SketchBox tone={on ? "ink" : "paper"} radius={999} pad="8px 16px">
              <span style={{ fontWeight: 700, fontSize: 14, color: on ? "var(--paper-2)" : "var(--ink-2)" }}>{name}</span>
            </SketchBox>
          </button>
        );
      })}
    </div>
  );
}
