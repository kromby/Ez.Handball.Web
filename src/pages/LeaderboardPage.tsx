import { useSearchParams } from "react-router-dom";
import type { LeaderboardMetric } from "../api/types";
import { ErrorView, Loading } from "../components/StateViews";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { METRICS, MetricSwitcher } from "../components/MetricSwitcher";
import { Pagination } from "../components/Pagination";
import { useLeaderboard } from "../query/hooks";

const LIMIT = 50;
const VALID = new Set(METRICS.map((m) => m.value));

function parseMetric(raw: string | null): LeaderboardMetric {
  return raw && VALID.has(raw as LeaderboardMetric) ? (raw as LeaderboardMetric) : "goals";
}

export default function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const metric = parseMetric(params.get("metric"));
  const offset = Math.max(0, Number(params.get("offset") ?? "0") || 0);

  const { data, isPending, isError, error } = useLeaderboard(metric, offset, LIMIT);

  const setMetric = (m: LeaderboardMetric) => {
    setParams({ metric: m });
  };
  const setOffset = (o: number) => {
    setParams({ metric, offset: String(o) });
  };

  return (
    <section>
      <h2 className="title">Leaderboard</h2>
      <MetricSwitcher value={metric} onChange={setMetric} />
      {isPending && <Loading />}
      {isError && <ErrorView error={error} notFoundLabel="Leaderboard not found" />}
      {data && (
        <>
          <LeaderboardTable entries={data.entries} metric={metric} />
          <Pagination offset={data.offset} limit={data.limit} total={data.total} onOffsetChange={setOffset} />
        </>
      )}
    </section>
  );
}
