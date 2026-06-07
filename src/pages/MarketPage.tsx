import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../api/money";
import type { PoolEntry, PoolSort } from "../api/types";
import { BuyButton } from "../components/BuyButton";
import { FilterChips } from "../components/FilterChips";
import { Pagination } from "../components/Pagination";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useGenders, usePlayerPool, useSeasons, useShortlist, useSquad, useSquadConstraints } from "../query/hooks";

const LIMIT = 50;
const SORTS: PoolSort[] = ["Rating", "Price"];

function parseSort(raw: string | null): PoolSort {
  return raw === "Price" ? "Price" : "Rating";
}

export default function MarketPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const offset = Math.max(0, Number(params.get("offset") ?? "0") || 0);
  const urlSeason = params.get("season") ?? undefined;
  const gender = params.get("gender") ?? undefined;
  const position = params.get("position") ?? undefined;
  const sort = parseSort(params.get("sort"));

  const seasons = useSeasons();
  const currentSeason = seasons.data?.find((s) => s.isCurrent)?.label;
  const season = urlSeason ?? currentSeason;
  const ready = urlSeason != null || !seasons.isPending;

  const genders = useGenders();
  const constraints = useSquadConstraints();
  const shortlist = useShortlist();
  const squad = useSquad();

  const pool = usePlayerPool(
    { season, gender, position, sort, offset, limit: LIMIT },
    { enabled: ready },
  );

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
          <span className="eyebrow">{t("market.eyebrow")}</span>
          <h1 className="title">{t("market.title")}</h1>
        </div>
        <div className="market-chips">
          <span className="chip">{t("market.budgetLeft", { amount: formatMoney(squad.data?.remainingBudget ?? null) })}</span>
          <span className="chip">{t("market.shortlisted", { count: shortlist.data?.count ?? 0 })}</span>
        </div>
      </div>

      <div className="market-filters">
        <FilterChips
          label={t("market.filterPosition")}
          options={[{ value: "", label: t("market.allPositions") }, ...positionCodes.map((c) => ({ value: c, label: c, title: posLabel(c) }))]}
          selected={position ?? ""}
          onSelect={(v) => update({ position: v, offset: undefined })}
        />
        <FilterChips
          label={t("leaderboard.filterGender")}
          options={[{ value: "", label: t("leaderboard.filterAllGenders") }, ...(genders.data ?? []).map((g) => ({ value: g.value, label: g.label }))]}
          selected={gender ?? ""}
          onSelect={(v) => update({ gender: v, offset: undefined })}
        />
        <FilterChips
          label={t("market.sortBy")}
          options={SORTS.map((s) => ({ value: s, label: t(`market.sort${s}`) }))}
          selected={sort}
          onSelect={(v) => update({ sort: v, offset: undefined })}
        />
      </div>

      {pool.isPending && <Loading />}
      {pool.isError && <ErrorView error={pool.error} notFoundLabel={t("market.notFound")} />}
      {pool.data && (
        <Panel>
          {pool.data.entries.length === 0 ? (
            <p className="status">{t("market.empty")}</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t("leaderboard.player")}</th>
                  <th>{t("leaderboard.club")}</th>
                  <th>{t("market.position")}</th>
                  <th className="num">{t("market.rating")}</th>
                  <th className="num">{t("market.price")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pool.data.entries.map((e: PoolEntry) => (
                  <tr key={e.playerId}>
                    <td>{e.name ?? t("match.unknownPlayer")}</td>
                    <td>{e.clubName ?? "—"}</td>
                    <td><span className="pos-chip">{posLabel(e.position)}</span></td>
                    <td className="num">{e.rating.toFixed(0)}</td>
                    <td className="num">{formatMoney(e.price)}</td>
                    <td><BuyButton player={{ playerId: e.playerId, name: e.name, position: e.position, price: e.price }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination offset={pool.data.offset} limit={pool.data.limit} total={pool.data.total} onOffsetChange={(o) => update({ offset: String(o) })} />
        </Panel>
      )}
    </section>
  );
}
