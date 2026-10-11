import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerStanding } from "../api/types";

const FALLBACK_WIDTH = 600;
const HEIGHT = 200;
const MARGIN = { top: 10, right: 12, bottom: 24, left: 36 };
const GRID_LINES = 4;
// Matches the --series-N custom properties in app.css.
const SERIES_COLOR_COUNT = 8;

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

// Team colours from the API often repeat, so the chart hands out its own palette:
// rivals take the series colours in standings order, and the viewer's team always gets
// the accent, which no series colour resembles.
function seriesColorOf(entries: ManagerStanding[], myTeamId: string | undefined): Map<string, string> {
  const colorByTeam = new Map<string, string>();
  let rivalIndex = 0;
  for (const entry of entries) {
    if (entry.teamId === myTeamId) {
      colorByTeam.set(entry.teamId, "var(--accent)");
    } else {
      colorByTeam.set(entry.teamId, `var(--series-${(rivalIndex % SERIES_COLOR_COUNT) + 1})`);
      rivalIndex += 1;
    }
  }
  return colorByTeam;
}

// The SVG is drawn at its real pixel width (viewBox = size) so text keeps a fixed size
// instead of scaling up with the panel.
function useElementWidth(element: HTMLElement | null): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth || FALLBACK_WIDTH));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return width;
}

export function LeagueProgressChart({ entries, myTeamId }: Props) {
  const { t } = useTranslation();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const width = useElementWidth(container);
  const labels = roundLabelsOf(entries);
  if (labels.length === 0) return <p className="status">{t("leagues.noRoundsYet")}</p>;

  const colorByTeam = seriesColorOf(entries, myTeamId);
  // The viewer's line is drawn last so no rival can cover it.
  const series = [...entries]
    .sort((first, second) => Number(first.teamId === myTeamId) - Number(second.teamId === myTeamId))
    .map((entry) => ({ entry, totals: totalsByRound(entry, labels) }));
  const highestTotal = Math.max(...series.flatMap((line) => line.totals), 1);
  const yMax = Math.ceil(highestTotal / GRID_LINES / 10) * GRID_LINES * 10;

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  // A single round has no span to stretch across, so it sits in the middle.
  const xOf = (index: number) =>
    MARGIN.left + (labels.length === 1 ? plotWidth / 2 : (index / (labels.length - 1)) * plotWidth);
  const yOf = (total: number) => MARGIN.top + plotHeight - (total / yMax) * plotHeight;

  return (
    <div className="league-chart" ref={setContainer}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={t("leagues.chartLabel")}>
        {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
          const value = (yMax / GRID_LINES) * step;
          return (
            <g key={value}>
              <line className="league-chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={yOf(value)} y2={yOf(value)} />
              <text className="league-chart-tick" x={MARGIN.left - 8} y={yOf(value)} textAnchor="end" dominantBaseline="middle">
                {value}
              </text>
            </g>
          );
        })}
        {labels.map((label, index) => (
          <text key={label} className="league-chart-tick" x={xOf(index)} y={HEIGHT - 6} textAnchor="middle">
            {label}
          </text>
        ))}
        {series.map(({ entry, totals }) => {
          const isMine = entry.teamId === myTeamId;
          return (
            <g key={entry.teamId} style={{ color: colorByTeam.get(entry.teamId) }} stroke="currentColor" fill="currentColor">
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
          <li key={entry.teamId} className={entry.teamId === myTeamId ? "league-chart-legend-mine" : undefined}>
            <span className="league-chart-swatch" style={{ background: colorByTeam.get(entry.teamId) }} />
            {entry.teamName}
          </li>
        ))}
      </ul>
    </div>
  );
}
