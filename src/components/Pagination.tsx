import { useTranslation } from "react-i18next";

export function Pagination({
  offset,
  limit,
  total,
  onOffsetChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onOffsetChange: (offset: number) => void;
}) {
  const { t } = useTranslation();
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="pagination">
      <button type="button" disabled={!hasPrev} onClick={() => onOffsetChange(Math.max(0, offset - limit))}>
        ← {t("leaderboard.prev")}
      </button>
      <span className="pagination-range">
        {t("leaderboard.paginationRange", { from, to, total })}
      </span>
      <button type="button" disabled={!hasNext} onClick={() => onOffsetChange(offset + limit)}>
        {t("leaderboard.next")} →
      </button>
    </div>
  );
}
