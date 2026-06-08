import { useTranslation } from "react-i18next";
import type { LeaderboardEntry, LeaderboardMetric, Money } from "../api/types";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { BuyButton } from "./BuyButton";

function metricValue(entry: LeaderboardEntry, metric: LeaderboardMetric): number {
  switch (metric) {
    case "goals": return entry.goals;
    case "games": return entry.games;
    case "yellowCards": return entry.yellowCards;
    case "twoMinuteSuspensions": return entry.twoMinuteSuspensions;
    case "redCards": return entry.redCards;
    default: {
      // Exhaustiveness guard: a new LeaderboardMetric without a case fails to compile here.
      const unhandled: never = metric;
      return unhandled;
    }
  }
}

export function LeaderboardTable({
  entries,
  metric,
  buyLookup,
}: {
  entries: LeaderboardEntry[];
  metric: LeaderboardMetric;
  buyLookup?: (playerId: string) => { position: string; price: Money } | undefined;
}) {
  const { t } = useTranslation();
  const before: PlayerColumn<LeaderboardEntry>[] = [
    {
      key: "rank",
      header: "#",
      align: "right",
      render: (e) => <span className={e.rank <= 3 ? `rank-medal rank-${e.rank}` : ""}>{e.rank}</span>,
    },
  ];
  const after: PlayerColumn<LeaderboardEntry>[] = [
    { key: "games", header: t("leaderboard.games"), align: "right", render: (e) => e.games },
    { key: "value", header: t("leaderboard.value"), align: "right", render: (e) => metricValue(e, metric) },
    { key: "avg", header: t("leaderboard.avgGoals"), align: "right", render: (e) => e.avgGoals.toFixed(2) },
  ];
  if (buyLookup) {
    after.push({
      key: "buy",
      header: "",
      render: (e) => {
        const info = buyLookup(e.playerId);
        return <BuyButton player={{ playerId: e.playerId, name: e.name, position: info?.position ?? null, price: info?.price ?? null }} />;
      },
    });
  }
  return <PlayerTable<LeaderboardEntry> rows={entries} before={before} after={after} />;
}
