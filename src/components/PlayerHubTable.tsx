import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import type { PoolEntry, PoolSort } from "../api/types";
import { formatMoney } from "../api/money";
import { useClubs } from "../query/hooks";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";
import { SortHeader } from "./SortHeader";
import { BuyButton } from "./BuyButton";

export function PlayerHubTable<T extends PoolEntry>({
  entries,
  sort,
  onSort,
  authed,
  leadingColumns,
  afterPositionColumns = [],
}: {
  entries: T[];
  /** Omit both to show plain headers and keep the server's row order. */
  sort?: PoolSort;
  onSort?: (sort: PoolSort) => void;
  authed: boolean;
  /** Columns before the player name; defaults to the pool rank. */
  leadingColumns?: PlayerColumn<T>[];
  afterPositionColumns?: PlayerColumn<T>[];
}) {
  const { t } = useTranslation();
  // Looked up here rather than passed in, so every page using this table shows logos.
  const clubs = useClubs();
  const clubLogos = useMemo(() => new Map((clubs.data ?? []).map((c) => [c.clubId, c.logoUrl])), [clubs.data]);
  const posLabel = (code: string) => t(`positions.${code}`, { defaultValue: code });

  const sortable = (label: string, sortKey: PoolSort) =>
    sort && onSort ? <SortHeader label={label} sortKey={sortKey} active={sort} onSort={onSort} /> : label;

  const before: PlayerColumn<T>[] = leadingColumns ?? [
    {
      key: "rank",
      header: "#",
      align: "right",
      render: (e) => <span className={e.rank <= 3 ? `rank-medal rank-${e.rank}` : ""}>{e.rank}</span>,
    },
  ];

  const after: PlayerColumn<T>[] = [
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
    ...afterPositionColumns,
    { key: "games", header: sortable(t("playerHub.games"), "Games"), align: "right", render: (e) => e.games },
    { key: "goals", header: sortable(t("playerHub.goals"), "Goals"), align: "right", render: (e) => e.goals },
    { key: "assists", header: t("playerHub.assists"), align: "right", render: (e) => e.assists },
    { key: "saves", header: t("playerHub.saves"), align: "right", render: (e) => e.saves },
    { key: "avg", header: t("playerHub.avgGoals"), align: "right", render: (e) => e.avgGoals.toFixed(2) },
    { key: "rating", header: sortable(t("playerHub.rating"), "Rating"), align: "right", render: (e) => e.rating.toFixed(0) },
    { key: "price", header: sortable(t("playerHub.price"), "Price"), align: "right", render: (e) => formatMoney(e.price) },
  ];

  if (authed) {
    after.push({
      key: "buy",
      header: "",
      render: (e) => <BuyButton player={{ playerId: e.playerId, name: e.name, position: e.position, price: e.price }} />,
    });
  }

  return <PlayerTable<T> rows={entries} before={before} after={after} emptyLabel={t("playerHub.empty")} clubLogos={clubLogos} />;
}
