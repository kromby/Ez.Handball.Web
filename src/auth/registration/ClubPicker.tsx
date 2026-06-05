import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Club } from "../../api/types";
import { SketchBox } from "../../components/SketchBox";
import { ClubCrest, type CrestShape } from "./ClubCrest";
import { Icon } from "./Icon";

function ClubRow({
  club,
  selected,
  onClick,
  shape,
}: {
  club: Club;
  selected: boolean;
  onClick: () => void;
  shape: CrestShape;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
    >
      <SketchBox
        tone={selected ? "amber" : "paper"}
        radius={13}
        pad="12px 15px"
        style={{ transition: "transform .12s", transform: selected ? "translateY(-1px)" : "none" }}
      >
        <div className="reg-club-row">
          <ClubCrest club={club} size={50} shape={shape} />
          <div className="reg-club-row-name">{club.name}</div>
        </div>
      </SketchBox>
    </button>
  );
}

/** A searchable list of clubs as crest rows — no dropdown. */
export function ClubPicker({
  clubs,
  value,
  onChange,
  shape = "hex",
}: {
  clubs: Club[];
  value: string | null;
  onChange: (clubId: string) => void;
  shape?: CrestShape;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? clubs.filter((club) => club.name.toLowerCase().includes(needle)) : clubs;
  }, [query, clubs]);

  return (
    <div>
      <div className="reg-club-search">
        <SketchBox tone="sunken" radius={11} pad="0">
          <div className="reg-club-search-row">
            <Icon name="search" size={16} style={{ color: "var(--ink-3)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("auth.searchClubs")}
              aria-label={t("auth.searchClubsLabel")}
            />
          </div>
        </SketchBox>
      </div>
      <div className="reg-club-list">
        {list.map((club) => (
          <ClubRow
            key={club.clubId}
            club={club}
            shape={shape}
            selected={value === club.clubId}
            onClick={() => onChange(club.clubId)}
          />
        ))}
        {list.length === 0 && <div className="reg-empty scribble">{t("auth.noClubsNamed")}</div>}
      </div>
    </div>
  );
}
