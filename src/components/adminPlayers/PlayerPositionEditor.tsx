import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSetPlayerPosition } from "../../query/hooks";

export const POSITION_CODES = ["GK", "LW", "RW", "LB", "CB", "RB", "LP"];

export interface PlayerPositionEditorProps {
  playerId: string;
  position: string | null;
  positionSecondary: string | null;
}

/**
 * Primary + secondary dropdowns with an explicit Save. Both values are always sent: the backend
 * treats a missing secondary as a clear (Backend#167), so "None" is the only way to clear one.
 */
export function PlayerPositionEditor({ playerId, position, positionSecondary }: PlayerPositionEditorProps) {
  const { t } = useTranslation();
  const setPosition = useSetPlayerPosition();
  // Unknown stored codes (e.g. hsi.is's "Leikmaður") start as unselected so the admin must pick one.
  const initialPrimary = position && POSITION_CODES.includes(position) ? position : "";
  const initialSecondary = positionSecondary && POSITION_CODES.includes(positionSecondary) ? positionSecondary : "";
  const [primary, setPrimary] = useState(initialPrimary);
  const [secondary, setSecondary] = useState(initialSecondary);

  const posLabel = (code: string) => t(`positions.${code}`, { defaultValue: code });
  const sameAsPrimary = secondary !== "" && secondary === primary;
  const changed = primary !== initialPrimary || secondary !== initialSecondary;
  const canSave = primary !== "" && !sameAsPrimary && changed && !setPosition.isPending;

  return (
    <div className="position-editor">
      <select
        aria-label={t("admin.players.position")}
        value={primary}
        disabled={setPosition.isPending}
        onChange={(e) => setPrimary(e.target.value)}
      >
        <option value="">{t("admin.players.choosePosition")}</option>
        {POSITION_CODES.map((code) => (
          <option key={code} value={code}>{posLabel(code)}</option>
        ))}
      </select>
      <select
        aria-label={t("admin.players.secondary")}
        value={secondary}
        disabled={setPosition.isPending}
        onChange={(e) => setSecondary(e.target.value)}
      >
        <option value="">{t("admin.players.none")}</option>
        {POSITION_CODES.map((code) => (
          <option key={code} value={code}>{posLabel(code)}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn-primary"
        disabled={!canSave}
        onClick={() => setPosition.mutate({ playerId, position: primary, positionSecondary: secondary || null })}
      >
        {t("admin.players.save")}
      </button>
      {sameAsPrimary && <span className="form-error">{t("admin.players.sameAsPrimary")}</span>}
      {setPosition.isPending && <span className="form-note">{t("admin.players.saving")}</span>}
      {setPosition.isError && <span className="form-error" role="alert">{t("admin.players.saveError")}</span>}
    </div>
  );
}
