import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PoolSort } from "../api/types";
import { FilterSelect } from "../components/FilterSelect";
import { SearchInput } from "../components/SearchInput";
import { PlayerHubTable } from "../components/PlayerHubTable";
import { Pagination } from "../components/Pagination";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import {
  useClubs, usePlayers, useSeasons, useShortlist, useSquadConstraints,
} from "../query/hooks";

const LIMIT = 50;
const SORTS: PoolSort[] = ["Goals", "Games", "YellowCards", "TwoMinuteSuspensions", "RedCards", "Rating", "Price"];
const VALID = new Set<PoolSort>(SORTS);

function parseSort(raw: string | null): PoolSort {
  return raw && VALID.has(raw as PoolSort) ? (raw as PoolSort) : "Goals";
}

export default function ShortlistPage() {
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

  const clubs = useClubs();
  const constraints = useSquadConstraints();
  const shortlist = useShortlist();

  const playerIds = shortlist.data?.items.map((i) => i.playerId) ?? [];
  const hasShortlistedPlayers = playerIds.length > 0;

  const players = usePlayers(
    { season, tournamentId, gender, position, name, clubId, sort, offset, limit: LIMIT, playerIds },
    { enabled: ready && hasShortlistedPlayers },
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
      <div className="page-head">
        <h1 className="title">{t("shortlist.title")}</h1>
        {shortlist.data && (
          <p className="subtitle">{t("shortlist.countOfMax", { count: shortlist.data.count, max: shortlist.data.max })}</p>
        )}
      </div>

      {shortlist.isPending && <Loading />}
      {shortlist.isError && <ErrorView error={shortlist.error} notFoundLabel={t("shortlist.notFound")} />}

      {shortlist.data && !hasShortlistedPlayers && <p className="status">{t("shortlist.empty")}</p>}

      {shortlist.data && hasShortlistedPlayers && (
        <>
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
              label={t("playerHub.filterPosition")}
              value={position ?? ""}
              options={[{ value: "", label: t("playerHub.allPositions") }, ...positionCodes.map((c) => ({ value: c, label: posLabel(c) }))]}
              onChange={(v) => update({ position: v, offset: undefined })}
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
        </>
      )}
    </section>
  );
}
