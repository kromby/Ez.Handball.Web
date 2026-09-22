import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import type { Club, PoolEntry, PoolSort } from "../api/types";
import { formatMoney } from "../api/money";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { SortHeader } from "./SortHeader";
import { BuyButton } from "./BuyButton";
import { GradeBadge } from "./GradeBadge";

export function PlayerHubTable({
  entries,
  sort,
  onSort,
  authed,
  clubs,
}: {
  entries: PoolEntry[];
  sort: PoolSort;
  onSort: (sort: PoolSort) => void;
  authed: boolean;
  clubs?: Club[];
}) {
  const { t } = useTranslation();
  const clubLogos = useMemo(() => new Map((clubs ?? []).map((c) => [c.clubId, c.logoUrl])), [clubs]);
  const posLabel = (code: string) => t(`positions.${code}`, { defaultValue: code });

  const before: PlayerColumn<PoolEntry>[] = [
    {
      key: "rank",
      header: "#",
      align: "right",
      render: (e) => <span className={e.rank <= 3 ? `rank-medal rank-${e.rank}` : ""}>{e.rank}</span>,
    },
  ];

  const after: PlayerColumn<PoolEntry>[] = [
    {
      key: "pos",
      header: t("playerHub.pos"),
      render: (e) => (
        <>
          <span className="pos-chip">{posLabel(e.position)}</span>
          {e.positionSecondary && <span className="pos-chip pos-chip--secondary">{posLabel(e.positionSecondary)}</span>}
        </>
      ),
    },
    { key: "games", header: <SortHeader label={t("playerHub.games")} sortKey="Games" active={sort} onSort={onSort} />, align: "right", render: (e) => e.games },
    { key: "goals", header: <SortHeader label={t("playerHub.goals")} sortKey="Goals" active={sort} onSort={onSort} />, align: "right", render: (e) => e.goals },
    { key: "assists", header: t("playerHub.assists"), align: "right", render: (e) => e.assists },
    { key: "saves", header: t("playerHub.saves"), align: "right", render: (e) => e.saves },
    { key: "avg", header: t("playerHub.avgGoals"), align: "right", render: (e) => e.avgGoals.toFixed(2) },
    { key: "rating", header: <SortHeader label={t("playerHub.rating")} sortKey="Rating" active={sort} onSort={onSort} />, align: "right", render: (e) => e.rating.toFixed(0) },
    { key: "form", header: t("playerHub.form"), align: "right", render: (e) => <GradeBadge grade={e.gradeTotal} /> },
    { key: "price", header: <SortHeader label={t("playerHub.price")} sortKey="Price" active={sort} onSort={onSort} />, align: "right", render: (e) => formatMoney(e.price) },
  ];

  if (authed) {
    after.push({
      key: "buy",
      header: "",
      render: (e) => <BuyButton player={{ playerId: e.playerId, name: e.name, position: e.position, price: e.price }} />,
    });
  }

  return <PlayerTable<PoolEntry> rows={entries} before={before} after={after} emptyLabel={t("playerHub.empty")} clubLogos={clubLogos} />;
}
