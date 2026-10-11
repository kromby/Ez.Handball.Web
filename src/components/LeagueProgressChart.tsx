import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerStanding } from "../api/types";
import { CHART_HEIGHT, CHART_MARGIN, roundLabelsOf, valueScaleOf } from "../lib/leagueChart";
import { useElementWidth } from "../lib/useElementWidth";
import { LeagueChartGrid } from "./LeagueChartGrid";
import { LeagueChartLegend } from "./LeagueChartLegend";

interface Props {
  entries: ManagerStanding[];
  myTeamId: string | undefined;
}

// A team that didn't score in a round keeps the total it had.
function totalsByRound(entry: ManagerStanding, labels: string[]): number[] {
  const totalByLabel = new Map(entry.rounds.map((round) => [round.roundLabel, round.totalPoints]));
  let lastTotal = 0;
  return labels.map((label) => {
    lastTotal = totalByLabel.get(label) ?? lastTotal;
    return lastTotal;
  });
}

export function LeagueProgressChart({ entries, myTeamId }: Props) {
  const { t } = useTranslation();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const width = useElementWidth(container);
  const labels = roundLabelsOf(entries);
  if (labels.length === 0) return <p className="status">{t("leagues.noRoundsYet")}</p>;

  const series = entries.map((entry) => ({ entry, totals: totalsByRound(entry, labels) }));
  const scale = valueScaleOf(series.flatMap((line) => line.totals));

  const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
  // A single round has no span to stretch across, so it sits in the middle.
  const xOf = (index: number) =>
    CHART_MARGIN.left + (labels.length === 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth);
  const yOf = (total: number) => CHART_MARGIN.top + plotHeight - ((total - scale.min) / (scale.max - scale.min)) * plotHeight;

  return (
    <div className="league-chart" ref={setContainer}>
      <svg width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`} role="img" aria-label={t("leagues.chartLabel")}>
        <LeagueChartGrid ticks={scale.ticks} width={width} yOf={yOf} />
        {labels.map((label, index) => (
          <text key={label} className="league-chart-tick" x={xOf(index)} y={CHART_HEIGHT - 6} textAnchor="middle">
            {label}
          </text>
        ))}
        {series.map(({ entry, totals }) => {
          const isMine = entry.teamId === myTeamId;
          return (
            <g key={entry.teamId} stroke={entry.color || "currentColor"} fill={entry.color || "currentColor"}>
              <polyline
                className={isMine ? "league-chart-line league-chart-line--mine" : "league-chart-line"}
                fill="none"
                points={totals.map((total, index) => `${xOf(index)},${yOf(total)}`).join(" ")}
              />
              {totals.map((total, index) => (
                <circle key={labels[index]} cx={xOf(index)} cy={yOf(total)} r={isMine ? 4 : 3}>
                  <title>{`${entry.teamName} · ${t("leagues.round", { label: labels[index] })}: ${total}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <LeagueChartLegend entries={entries} />
    </div>
  );
}
