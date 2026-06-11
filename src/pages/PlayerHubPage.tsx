import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../api/money";
import type { PoolSort } from "../api/types";
import { FilterSelect } from "../components/FilterSelect";
import { SearchInput } from "../components/SearchInput";
import { PlayerHubTable } from "../components/PlayerHubTable";
import { Pagination } from "../components/Pagination";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import {
  useClubs, useGenders, usePlayers, useSeasons, useShortlist, useSquad, useSquadConstraints, useTournaments,
} from "../query/hooks";

const LIMIT = 50;
const SORTS: PoolSort[] = ["Goals", "Games", "YellowCards", "TwoMinuteSuspensions", "RedCards", "Rating", "Price"];
const VALID = new Set<PoolSort>(SORTS);

function parseSort(raw: string | null): PoolSort {
  return raw && VALID.has(raw as PoolSort) ? (raw as PoolSort) : "Goals";
}

export default function PlayerHubPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const authed = status === "authenticated";
  const [params, setParams] = useSearchParams();

  const offset = Math.max(0, Number(params.get("offset") ?? "0") || 0);
  const urlSeason = params.get("season") ?? undefined;
  const gender = params.get("gender") ?? undefined;
  const position = params.get("position") ?? undefined;
  const tournamentId = params.get("tournamentId") ?? undefined;
  const name = params.get("name") ?? undefined;
  const clubId = params.get("clubId") ?? undefined;
  const sort = parseSort(params.get("sort"));

  const seasons = useSeasons();
  const currentSeason = seasons.data?.find((s) => s.isCurrent)?.label;
  const season = urlSeason ?? currentSeason;
  const ready = urlSeason != null || !seasons.isPending;

  const tournaments = useTournaments(season);
  const genders = useGenders();
  const clubs = useClubs();
  const constraints = useSquadConstraints();
  const shortlist = useShortlist();
  const squad = useSquad();

  const players = usePlayers(
    { season, tournamentId, gender, position, name, clubId, sort, offset, limit: LIMIT },
    { enabled: ready },
  );

  // Merge param updates so filters compose; "" / undefined removes a param.
  const update = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") merged.delete(k);
      else merged.set(k, v);
    }
    setParams(merged);
  };

  const positionCodes = constraints.data ? Object.keys(constraints.data.posLimits) : [];
  const posLabel = (code: string) => t(`positions.${code}`, { defaultValue: code });

  return (
    <section className="stack">
      <div className="page-head market-head">
        <div>
          <h1 className="title">{t("playerHub.title")}</h1>
        </div>
        {authed && (
          <div className="market-chips">
            <span className="chip">{t("playerHub.budgetLeft", { amount: formatMoney(squad.data?.remainingBudget ?? null) })}</span>
            <span className="chip">{t("playerHub.shortlisted", { count: shortlist.data?.count ?? 0 })}</span>
          </div>
        )}
      </div>

      <div className="market-filters">
        <SearchInput
          initialValue={name ?? ""}
          placeholder={t("playerHub.searchName")}
          clearLabel={t("playerHub.clearSearch")}
          onSearch={(v) => update({ name: v, offset: undefined })}
        />
        <FilterSelect
          label={t("playerHub.filterSeason")}
          value={season ?? ""}
          options={(seasons.data ?? []).map((s) => ({ value: s.label, label: s.label }))}
          onChange={(v) => update({ season: v, tournamentId: undefined, offset: undefined })}
        />
        <FilterSelect
          label={t("playerHub.filterGender")}
          value={gender ?? ""}
          options={[{ value: "", label: t("playerHub.allGenders") }, ...(genders.data ?? []).map((g) => ({ value: g.value, label: g.label }))]}
          onChange={(v) => update({ gender: v, offset: undefined })}
        />
        <FilterSelect
          label={t("playerHub.filterPosition")}
          value={position ?? ""}
          options={[{ value: "", label: t("playerHub.allPositions") }, ...positionCodes.map((c) => ({ value: c, label: posLabel(c) }))]}
          onChange={(v) => update({ position: v, offset: undefined })}
        />
        <FilterSelect
          label={t("playerHub.filterTournament")}
          value={tournamentId ?? ""}
          options={[{ value: "", label: t("playerHub.allTournaments") }, ...(tournaments.data ?? []).map((tn) => ({ value: tn.tournamentId, label: tn.name }))]}
          onChange={(v) => update({ tournamentId: v, offset: undefined })}
        />
        <FilterSelect
          label={t("playerHub.filterTeam")}
          value={clubId ?? ""}
          options={[
            { value: "", label: t("playerHub.allTeams") },
            ...[...(clubs.data ?? [])]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => ({ value: c.clubId, label: c.name })),
          ]}
          onChange={(v) => update({ clubId: v, offset: undefined })}
        />
      </div>

      {players.isPending && <Loading />}
      {players.isError && <ErrorView error={players.error} notFoundLabel={t("playerHub.notFound")} />}
      {players.data && (
        <Panel>
          <PlayerHubTable
            entries={players.data.entries}
            sort={sort}
            onSort={(s) => update({ sort: s, offset: undefined })}
            authed={authed}
          />
          <Pagination
            offset={players.data.offset}
            limit={players.data.limit}
            total={players.data.total}
            onOffsetChange={(o) => update({ offset: String(o) })}
          />
        </Panel>
      )}
    </section>
  );
}
