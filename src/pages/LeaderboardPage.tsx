import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LeaderboardMetric } from "../api/types";
import { ErrorView, Loading } from "../components/StateViews";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { LeaderboardFilters } from "../components/LeaderboardFilters";
import { METRICS, MetricSwitcher } from "../components/MetricSwitcher";
import { Pagination } from "../components/Pagination";
import { Panel } from "../components/Panel";
import { useGenders, useLeaderboard, usePlayerPool, useSeasons, useTournaments } from "../query/hooks";
import { useAuth } from "../auth/useAuth";

const LIMIT = 50;
const VALID = new Set(METRICS.map((m) => m.value));

function parseMetric(raw: string | null): LeaderboardMetric {
  return raw && VALID.has(raw as LeaderboardMetric) ? (raw as LeaderboardMetric) : "goals";
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const metric = parseMetric(params.get("metric"));
  const offset = Math.max(0, Number(params.get("offset") ?? "0") || 0);
  const urlSeason = params.get("season") ?? undefined;
  const tournamentId = params.get("tournamentId") ?? undefined;
  const gender = params.get("gender") ?? undefined;

  const seasons = useSeasons();
  const currentSeason = seasons.data?.find((s) => s.isCurrent)?.label;
  const season = urlSeason ?? currentSeason;
  const leaderboardReady = urlSeason != null || !seasons.isPending;

  const tournaments = useTournaments(season);
  const genders = useGenders();

  const { data, isPending, isError, error } = useLeaderboard(
    metric,
    offset,
    LIMIT,
    { season, tournamentId, gender },
    { enabled: leaderboardReady },
  );

  const { status } = useAuth();
  // Fetch a wide pool slice for the same scope so leaderboard rows can resolve price/position.
  const pool = usePlayerPool(
    { season, tournamentId, gender, limit: 200 },
    { enabled: status === "authenticated" && leaderboardReady },
  );
  const buyLookup = useMemo(() => {
    const map = new Map<string, { position: string; price: import("../api/types").Money }>();
    for (const e of pool.data?.entries ?? []) map.set(e.playerId, { position: e.position, price: e.price });
    return (playerId: string) => map.get(playerId);
  }, [pool.data]);

  // Merge param updates so filters compose; "" / undefined removes a param.
  const update = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === "") merged.delete(key);
      else merged.set(key, value);
    }
    setParams(merged);
  };

  return (
    <section className="stack">
      <div className="page-head">
        <h2 className="title">{t("leaderboard.title")}</h2>
        <MetricSwitcher value={metric} onChange={(m) => update({ metric: m, offset: undefined })} />
      </div>
      <LeaderboardFilters
        seasons={seasons.data ?? []}
        tournaments={tournaments.data ?? []}
        genders={genders.data ?? []}
        season={season}
        tournamentId={tournamentId}
        gender={gender}
        onSeasonChange={(s) => update({ season: s, tournamentId: undefined, offset: undefined })}
        onTournamentChange={(id) => update({ tournamentId: id, offset: undefined })}
        onGenderChange={(g) => update({ gender: g, offset: undefined })}
      />
      {isPending && <Loading />}
      {isError && <ErrorView error={error} notFoundLabel={t("leaderboard.notFound")} />}
      {data && (
        <Panel>
          <LeaderboardTable
              entries={data.entries}
              metric={metric}
              buyLookup={status === "authenticated" ? buyLookup : undefined}
            />
          <Pagination
            offset={data.offset}
            limit={data.limit}
            total={data.total}
            onOffsetChange={(o) => update({ offset: String(o) })}
          />
        </Panel>
      )}
    </section>
  );
}
