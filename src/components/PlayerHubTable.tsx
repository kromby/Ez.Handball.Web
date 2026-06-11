import { useTranslation } from "react-i18next";
import type { PoolEntry, PoolSort } from "../api/types";
import { formatMoney } from "../api/money";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { SortHeader } from "./SortHeader";
import { BuyButton } from "./BuyButton";

export function PlayerHubTable({
  entries,
  sort,
  onSort,
  authed,
}: {
  entries: PoolEntry[];
  sort: PoolSort;
  onSort: (sort: PoolSort) => void;
  authed: boolean;
}) {
  const { t } = useTranslation();
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
    { key: "pos", header: t("playerHub.pos"), render: (e) => <span className="pos-chip">{posLabel(e.position)}</span> },
    { key: "games", header: <SortHeader label={t("playerHub.games")} sortKey="Games" active={sort} onSort={onSort} />, align: "right", render: (e) => e.games },
    { key: "goals", header: <SortHeader label={t("playerHub.goals")} sortKey="Goals" active={sort} onSort={onSort} />, align: "right", render: (e) => e.goals },
    { key: "avg", header: t("playerHub.avgGoals"), align: "right", render: (e) => e.avgGoals.toFixed(2) },
    { key: "rating", header: <SortHeader label={t("playerHub.rating")} sortKey="Rating" active={sort} onSort={onSort} />, align: "right", render: (e) => e.rating.toFixed(0) },
    { key: "price", header: <SortHeader label={t("playerHub.price")} sortKey="Price" active={sort} onSort={onSort} />, align: "right", render: (e) => formatMoney(e.price) },
  ];

  if (authed) {
    after.push({
      key: "buy",
      header: "",
      render: (e) => <BuyButton player={{ playerId: e.playerId, name: e.name, position: e.position, price: e.price }} />,
    });
  }

  return <PlayerTable<PoolEntry> rows={entries} before={before} after={after} emptyLabel={t("playerHub.empty")} />;
}
