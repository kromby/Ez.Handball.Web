import { useTranslation } from "react-i18next";
import type { Club, Season } from "../api/types";
import { FilterSelect } from "./FilterSelect";
import { SearchInput } from "./SearchInput";

/** The shared search/season/position/team filter bar for the players page and
    the shortlist page — kept as one component so the two stay in sync as
    filters are added or removed. */
export function PlayerFilterBar({
  name,
  onNameChange,
  season,
  seasons,
  onSeasonChange,
  position,
  positionCodes,
  onPositionChange,
  clubId,
  clubs,
  onClubIdChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
  season: string;
  seasons: Season[];
  onSeasonChange: (value: string) => void;
  position: string;
  positionCodes: string[];
  onPositionChange: (value: string) => void;
  clubId: string;
  clubs: Club[];
  onClubIdChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const posLabel = (code: string) => t(`positions.${code}`, { defaultValue: code });

  return (
    <div className="market-filters">
      <SearchInput
        initialValue={name}
        placeholder={t("playerHub.searchName")}
        clearLabel={t("playerHub.clearSearch")}
        onSearch={onNameChange}
      />
      <FilterSelect
        label={t("playerHub.filterSeason")}
        value={season}
        options={seasons.map((s) => ({ value: s.label, label: s.label }))}
        onChange={onSeasonChange}
      />
      <FilterSelect
        label={t("playerHub.filterPosition")}
        value={position}
        options={[{ value: "", label: t("playerHub.allPositions") }, ...positionCodes.map((c) => ({ value: c, label: posLabel(c) }))]}
        onChange={onPositionChange}
      />
      <FilterSelect
        label={t("playerHub.filterTeam")}
        value={clubId}
        options={[
          { value: "", label: t("playerHub.allTeams") },
          ...[...clubs]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => ({ value: c.clubId, label: c.name })),
        ]}
        onChange={onClubIdChange}
      />
    </div>
  );
}
