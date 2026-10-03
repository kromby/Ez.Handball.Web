import { useTranslation } from "react-i18next";
import type { ManagerStanding } from "../api/types";

const WIDTH = 600;
const HEIGHT = 260;
const MARGIN = { top: 12, right: 16, bottom: 30, left: 44 };
const GRID_LINES = 4;

interface Props {
  entries: ManagerStanding[];
  myTeamId: string | undefined;
}

// Every team shares the same settled rounds except ones it has no score for, so the
// longest history is a good axis; labels only a shorter history has are appended.
function roundLabelsOf(entries: ManagerStanding[]): string[] {
  const labels: string[] = [];
  const longestFirst = [...entries].sort((first, second) => second.rounds.length - first.rounds.length);
  for (const entry of longestFirst) {
    for (const round of entry.rounds) {
      if (!labels.includes(round.roundLabel)) labels.push(round.roundLabel);
    }
  }
  return labels;
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
  const labels = roundLabelsOf(entries);
  if (labels.length === 0) return <p className="status">{t("leagues.noRoundsYet")}</p>;

  const series = entries.map((entry) => ({ entry, totals: totalsByRound(entry, labels) }));
  const highestTotal = Math.max(...series.flatMap((line) => line.totals), 1);
  const yMax = Math.ceil(highestTotal / GRID_LINES / 10) * GRID_LINES * 10;

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  // A single round has no span to stretch across, so it sits in the middle.
  const xOf = (index: number) =>
    MARGIN.left + (labels.length === 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth);
  const yOf = (total: number) => MARGIN.top + plotHeight - (total / yMax) * plotHeight;

  return (
    <div className="league-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t("leagues.chartLabel")}>
        {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
          const value = (yMax / GRID_LINES) * step;
          return (
            <g key={value}>
              <line className="league-chart-grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yOf(value)} y2={yOf(value)} />
              <text className="league-chart-tick" x={MARGIN.left - 8} y={yOf(value)} textAnchor="end" dominantBaseline="middle">
                {value}
              </text>
            </g>
          );
        })}
        {labels.map((label, index) => (
          <text key={label} className="league-chart-tick" x={xOf(index)} y={HEIGHT - 8} textAnchor="middle">
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
      <ul className="league-chart-legend">
        {entries.map((entry) => (
          <li key={entry.teamId}>
            <span className="league-chart-swatch" style={{ background: entry.color }} />
            {entry.teamName}
          </li>
        ))}
      </ul>
    </div>
  );
}
