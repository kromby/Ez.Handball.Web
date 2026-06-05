import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { SketchBox } from "../../components/SketchBox";

/** A sketch-bordered text/email/password input with an inline error or hint. */
export function RegField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;
  const bad = Boolean(error);
  const errorTone: CSSProperties = { "--amber-wash": "#f6e2d6", "--amber-deep": "var(--bad)" } as CSSProperties;

  return (
    <div>
      <div className="reg-field-head">
        <label className="reg-field-label" htmlFor={id}>
          {label}
        </label>
        {bad ? (
          <span className="reg-field-error">{error}</span>
        ) : hint ? (
          <span className="reg-field-hint">{hint}</span>
        ) : null}
      </div>
      <SketchBox tone={bad ? "amber" : "paper"} radius={11} pad="0" style={bad ? errorTone : undefined}>
        <div className="reg-input-row">
          <input
            id={id}
            type={inputType}
            className="reg-input"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          {isPassword && (
            <button type="button" tabIndex={-1} className="reg-input-toggle" onClick={() => setShow((s) => !s)}>
              {show ? t("auth.hidePassword") : t("auth.showPassword")}
            </button>
          )}
        </div>
      </SketchBox>
    </div>
  );
}
