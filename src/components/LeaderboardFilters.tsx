import { useTranslation } from "react-i18next";
import type { Gender, Season, Tournament } from "../api/types";
import { FilterChips } from "./FilterChips";

export function LeaderboardFilters({
  seasons,
  tournaments,
  genders,
  season,
  tournamentId,
  gender,
  onSeasonChange,
  onTournamentChange,
  onGenderChange,
}: {
  seasons: Season[];
  tournaments: Tournament[];
  genders: Gender[];
  season: string | undefined;
  tournamentId: string | undefined;
  gender: string | undefined;
  onSeasonChange: (value: string) => void;
  onTournamentChange: (value: string) => void;
  onGenderChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="leaderboard-filters">
      {seasons.length > 0 && (
        <FilterChips
          label={t("leaderboard.filterSeason")}
          options={seasons.map((s) => ({ value: s.label, label: s.label }))}
          selected={season ?? ""}
          onSelect={onSeasonChange}
        />
      )}
      {season != null && tournaments.length > 0 && (
        <FilterChips
          label={t("leaderboard.filterTournament")}
          options={[
            { value: "", label: t("leaderboard.filterAllTournaments") },
            ...tournaments.map((x) => ({ value: x.tournamentId, label: x.name }),
            ),
          ]}
          selected={tournamentId ?? ""}
          onSelect={onTournamentChange}
        />
      )}
      {genders.length > 0 && (
        <FilterChips
          label={t("leaderboard.filterGender")}
          options={[
            { value: "", label: t("leaderboard.filterAllGenders") },
            ...genders.map((g) => ({ value: g.value, label: g.label })),
          ]}
          selected={gender ?? ""}
          onSelect={onGenderChange}
        />
      )}
    </div>
  );
}
